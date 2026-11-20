import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getMembership(database, conversationId, userId) {
  return database
    .prepare(
      "SELECT conversation_id FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    )
    .bind(conversationId, userId)
    .first();
}

export async function GET(request, { params }) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to view messages." }, { status: 401 });
    }

    const { id } = await params;
    const membership = await getMembership(database, id, user.id);
    if (!membership) {
      return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
    }

    const result = await database
      .prepare(
        `SELECT messages.id, messages.content, messages.created_at,
                users.id AS sender_id, users.display_name AS sender_name,
                users.handle AS sender_handle
         FROM messages
         JOIN users ON users.id = messages.sender_id
         WHERE messages.conversation_id = ?
         ORDER BY messages.created_at DESC, messages.id DESC
         LIMIT 100`,
      )
      .bind(id)
      .all();
    const messages = (result.results || []).reverse().map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.created_at,
      sender: {
        id: message.sender_id,
        name: message.sender_name,
        handle: message.sender_handle,
      },
    }));

    await database
      .prepare("UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?")
      .bind(new Date().toISOString(), id, user.id)
      .run();
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Loading messages failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load messages." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to send messages." }, { status: 401 });
    }

    const { id } = await params;
    const membership = await getMembership(database, id, user.id);
    if (!membership) {
      return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 4000) {
      return NextResponse.json(
        { success: false, error: "Message content must be between 1 and 4,000 characters." },
        { status: 400 },
      );
    }

    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const recipients = await database
      .prepare("SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id != ?")
      .bind(id, user.id)
      .all();
    const statements = [
      database
        .prepare("INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)")
        .bind(messageId, id, user.id, content),
      database
        .prepare("UPDATE conversations SET updated_at = ? WHERE id = ?")
        .bind(createdAt, id),
      database
        .prepare("UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?")
        .bind(createdAt, id, user.id),
    ];
    for (const recipient of recipients.results || []) {
      statements.push(
        database
          .prepare(
            `INSERT INTO notifications (id, recipient_id, actor_id, type, message_id)
             VALUES (?, ?, ?, 'message', ?)`,
          )
          .bind(crypto.randomUUID(), recipient.user_id, user.id, messageId),
      );
    }
    await database.batch(statements);

    return NextResponse.json(
      {
        success: true,
        message: {
          id: messageId,
          content,
          createdAt,
          sender: { id: user.id, name: user.name, handle: user.handle },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Sending message failed:", error);
    return NextResponse.json({ success: false, error: "Unable to send the message." }, { status: 500 });
  }
}
