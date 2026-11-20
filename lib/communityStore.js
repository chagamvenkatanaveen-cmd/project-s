function toPost(row, comments, options) {
  const pollOptions = options.map((option) => ({
    id: option.id,
    text: option.option_text,
    votes: option.votes,
  }));
  const userVoteId = options.find((option) => option.user_vote_id)?.user_vote_id || null;

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    author: {
      name: row.author_name,
      handle: row.author_handle,
      badge: row.type === "article" ? "Writer" : row.type === "poll" ? "Poll Creator" : "Fan",
    },
    tag: row.tag,
    topic: row.topic,
    matchTag: row.match_tag,
    likes: row.likes,
    likedByMe: Boolean(row.liked_by_me),
    views: 0,
    createdAt: row.created_at,
    poll:
      row.type === "poll"
        ? {
            totalVotes: pollOptions.reduce((total, option) => total + option.votes, 0),
            options: pollOptions,
            userVoteId,
          }
        : null,
    comments: comments.map((comment) => ({
      id: comment.id,
      author: comment.author_name,
      text: comment.content,
      createdAt: comment.created_at,
    })),
  };
}

export async function getPosts(database, userId, savedOnly = false) {
  const savedFilter = savedOnly
    ? `WHERE EXISTS (
         SELECT 1 FROM saved_posts
         WHERE saved_posts.post_id = posts.id AND saved_posts.user_id = ?
       )`
    : "";
  const result = await database
    .prepare(
      `SELECT
         posts.id,
         posts.type,
         posts.title,
         posts.content,
         posts.tag,
         posts.topic,
         posts.match_tag,
         posts.created_at,
         users.display_name AS author_name,
         users.handle AS author_handle,
         (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes,
         EXISTS (
           SELECT 1 FROM likes
           WHERE likes.post_id = posts.id AND likes.user_id = ?
         ) AS liked_by_me
       FROM posts
       JOIN users ON users.id = posts.author_id
       ${savedFilter}
       ORDER BY posts.created_at DESC
       LIMIT 100`,
    )
    .bind(...(savedOnly ? [userId, userId || null] : [userId || null]))
    .all();

  const rows = result.results || [];
  if (rows.length === 0) {
    return [];
  }

  const postIds = rows.map((row) => row.id);
  const placeholders = postIds.map(() => "?").join(", ");
  const [commentsResult, optionsResult] = await Promise.all([
    database
      .prepare(
        `SELECT comments.id, comments.post_id, comments.content, comments.created_at,
                users.display_name AS author_name
         FROM comments
         JOIN users ON users.id = comments.author_id
         WHERE comments.post_id IN (${placeholders})
         ORDER BY comments.created_at ASC`,
      )
      .bind(...postIds)
      .all(),
    database
      .prepare(
        `SELECT poll_options.id, poll_options.post_id, poll_options.option_text,
                (SELECT COUNT(*) FROM poll_votes WHERE poll_votes.option_id = poll_options.id) AS votes,
                (SELECT option_id FROM poll_votes
                 WHERE poll_votes.post_id = poll_options.post_id AND poll_votes.user_id = ?
                 LIMIT 1) AS user_vote_id
         FROM poll_options
         WHERE poll_options.post_id IN (${placeholders})
         ORDER BY poll_options.position ASC`,
      )
      .bind(userId || null, ...postIds)
      .all(),
  ]);

  const commentsByPost = new Map();
  for (const comment of commentsResult.results || []) {
    const comments = commentsByPost.get(comment.post_id) || [];
    comments.push(comment);
    commentsByPost.set(comment.post_id, comments);
  }

  const optionsByPost = new Map();
  for (const option of optionsResult.results || []) {
    const options = optionsByPost.get(option.post_id) || [];
    options.push(option);
    optionsByPost.set(option.post_id, options);
  }

  return rows.map((row) =>
    toPost(row, commentsByPost.get(row.id) || [], optionsByPost.get(row.id) || []),
  );
}

export async function createPost(database, user, fields) {
  const postId = crypto.randomUUID();
  const statements = [
    database
      .prepare(
        `INSERT INTO posts
           (id, author_id, type, title, content, tag, topic, match_tag)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        postId,
        user.id,
        fields.type,
        fields.title,
        fields.content,
        fields.tag,
        fields.topic,
        fields.matchTag,
      ),
  ];

  if (fields.type === "poll") {
    fields.pollOptions.forEach((option, position) => {
      statements.push(
        database
          .prepare(
            "INSERT INTO poll_options (id, post_id, option_text, position) VALUES (?, ?, ?, ?)",
          )
          .bind(crypto.randomUUID(), postId, option, position),
      );
    });
  }

  await database.batch(statements);
  const posts = await getPosts(database, user.id);
  const createdPost = posts.find((post) => post.id === postId);
  if (!createdPost) {
    throw new Error("The new post could not be loaded after it was created.");
  }
  return createdPost;
}

export async function toggleLike(database, postId, userId) {
  const post = await database
    .prepare("SELECT id, author_id FROM posts WHERE id = ?")
    .bind(postId)
    .first();
  if (!post) {
    return null;
  }

  const existingLike = await database
    .prepare("SELECT user_id FROM likes WHERE user_id = ? AND post_id = ?")
    .bind(userId, postId)
    .first();

  if (existingLike) {
    await database
      .prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?")
      .bind(userId, postId)
      .run();
  } else {
    const inserted = await database
      .prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)")
      .bind(userId, postId)
      .run();
    if (inserted.meta.changes && post.author_id !== userId) {
      await database
        .prepare(
          `INSERT INTO notifications (id, recipient_id, actor_id, type, post_id)
           VALUES (?, ?, ?, 'like', ?)`,
        )
        .bind(crypto.randomUUID(), post.author_id, userId, postId)
        .run();
    }
  }

  const [count, like] = await Promise.all([
    database
      .prepare("SELECT COUNT(*) AS likes FROM likes WHERE post_id = ?")
      .bind(postId)
      .first(),
    database
      .prepare("SELECT user_id FROM likes WHERE user_id = ? AND post_id = ?")
      .bind(userId, postId)
      .first(),
  ]);

  return { likes: count.likes, liked: Boolean(like) };
}

export async function addComment(database, postId, user, text) {
  const post = await database
    .prepare("SELECT id, author_id FROM posts WHERE id = ?")
    .bind(postId)
    .first();
  if (!post) {
    return null;
  }

  const commentId = crypto.randomUUID();
  const statements = [
    database
      .prepare("INSERT INTO comments (id, post_id, author_id, content) VALUES (?, ?, ?, ?)")
      .bind(commentId, postId, user.id, text),
  ];
  if (post.author_id !== user.id) {
    statements.push(
      database
        .prepare(
          `INSERT INTO notifications (id, recipient_id, actor_id, type, post_id, comment_id)
           VALUES (?, ?, ?, 'comment', ?, ?)`,
        )
        .bind(crypto.randomUUID(), post.author_id, user.id, postId, commentId),
    );
  }
  await database.batch(statements);

  return {
    id: commentId,
    author: user.name,
    text,
    createdAt: new Date().toISOString(),
  };
}

export async function votePoll(database, postId, userId, optionId) {
  const option = await database
    .prepare(
      `SELECT poll_options.id
       FROM poll_options
       JOIN posts ON posts.id = poll_options.post_id
       WHERE posts.id = ? AND posts.type = 'poll' AND poll_options.id = ?`,
    )
    .bind(postId, optionId)
    .first();
  if (!option) {
    return null;
  }

  const previousVote = await database
    .prepare("SELECT option_id FROM poll_votes WHERE user_id = ? AND post_id = ?")
    .bind(userId, postId)
    .first();
  if (previousVote) {
    return { alreadyVoted: true };
  }

  const inserted = await database
    .prepare("INSERT OR IGNORE INTO poll_votes (user_id, post_id, option_id) VALUES (?, ?, ?)")
    .bind(userId, postId, optionId)
    .run();
  if (!inserted.meta.changes) {
    return { alreadyVoted: true };
  }

  const posts = await getPosts(database, userId);
  const post = posts.find((item) => item.id === postId);
  if (!post?.poll) {
    throw new Error("The poll could not be loaded after the vote was recorded.");
  }
  return { alreadyVoted: false, poll: post.poll };
}
