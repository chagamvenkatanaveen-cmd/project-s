import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to view conversations." }, { status: 401 });
    }

    const result = await database
      .prepare(
        `SELECT conversations.id, conversations.updated_at,
                last_message.id AS last_message_id,
                last_message.content AS last_message_content,
                last_message.created_at AS last_message_at,
                last_sender.id AS last_sender_id,
                last_sender.display_name AS last_sender_name,
                last_sender.handle AS last_sender_handle,
                (SELECT COUNT(*) FROM messages
                 WHERE messages.conversation_id = conversations.id
                   AND messages.sender_id != ?
                   AND messages.created_at > COALESCE(current_member.last_read_at, '')) AS unread_count
         FROM conversations
         JOIN conversation_members AS current_member
           ON current_member.conversation_id = conversations.id
          AND current_member.user_id = ?
         LEFT JOIN messages AS last_message
           ON last_message.id = (
             SELECT id FROM messages
             WHERE messages.conversation_id = conversations.id
             ORDER BY messages.created_at DESC, messages.id DESC
             LIMIT 1
           )
         LEFT JOIN users AS last_sender ON last_sender.id = last_message.sender_id
         ORDER BY COALESCE(last_message.created_at, conversations.updated_at) DESC
         LIMIT 100`,
      )
      .bind(user.id, user.id)
      .all();

    const conversations = result.results || [];
    if (conversations.length === 0) {
      return NextResponse.json({ success: true, conversations: [] });
    }

    const ids = conversations.map((conversation) => conversation.id);
    const placeholders = ids.map(() => "?").join(", ");
    const membersResult = await database
      .prepare(
        `SELECT conversation_members.conversation_id, users.id, users.handle,
                users.display_name AS name
         FROM conversation_members
         JOIN users ON users.id = conversation_members.user_id
         WHERE conversation_members.conversation_id IN (${placeholders})
         ORDER BY conversation_members.joined_at ASC`,
      )
      .bind(...ids)
      .all();
    const membersByConversation = new Map();
    for (const member of membersResult.results || []) {
      const members = membersByConversation.get(member.conversation_id) || [];
      members.push({ id: member.id, handle: member.handle, name: member.name });
      membersByConversation.set(member.conversation_id, members);
    }

    return NextResponse.json({
      success: true,
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        updatedAt: conversation.updated_at,
        unreadCount: conversation.unread_count,
        members: membersByConversation.get(conversation.id) || [],
        lastMessage: conversation.last_message_id
          ? {
              id: conversation.last_message_id,
              content: conversation.last_message_content,
              createdAt: conversation.last_message_at,
              sender: {
                id: conversation.last_sender_id,
                name: conversation.last_sender_name,
                handle: conversation.last_sender_handle,
              },
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Loading conversations failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load conversations." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to start a conversation." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const handle = typeof body?.recipientHandle === "string" ? body.recipientHandle.trim() : "";
    if (!handle || handle.length > 24) {
      return NextResponse.json({ success: false, error: "A valid recipientHandle is required." }, { status: 400 });
    }

    const recipient = await database
      .prepare("SELECT id FROM users WHERE handle = ?")
      .bind(handle)
      .first();
    if (!recipient) {
      return NextResponse.json({ success: false, error: "Recipient not found." }, { status: 404 });
    }
    if (recipient.id === user.id) {
      return NextResponse.json({ success: false, error: "You cannot message yourself." }, { status: 400 });
    }

    const existing = await database
      .prepare(
        `SELECT conversations.id
         FROM conversations
         JOIN conversation_members AS sender_member
           ON sender_member.conversation_id = conversations.id AND sender_member.user_id = ?
         JOIN conversation_members AS recipient_member
           ON recipient_member.conversation_id = conversations.id AND recipient_member.user_id = ?
         WHERE (SELECT COUNT(*) FROM conversation_members
                WHERE conversation_members.conversation_id = conversations.id) = 2
         LIMIT 1`,
      )
      .bind(user.id, recipient.id)
      .first();
    if (existing) {
      return NextResponse.json({ success: true, conversationId: existing.id, created: false });
    }

    const conversationId = crypto.randomUUID();
    await database.batch([
      database.prepare("INSERT INTO conversations (id) VALUES (?)").bind(conversationId),
      database
        .prepare("INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)")
        .bind(conversationId, user.id),
      database
        .prepare("INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)")
        .bind(conversationId, recipient.id),
    ]);
    return NextResponse.json(
      { success: true, conversationId, created: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("Creating conversation failed:", error);
    return NextResponse.json({ success: false, error: "Unable to create the conversation." }, { status: 500 });
  }
}
