import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { validateSupportMessage } from "@/lib/supportValidation";

export const dynamic = "force-dynamic";

async function getSupportMessages(database, conversationId) {
  const result = await database
    .prepare(
      `SELECT m.id, m.sender_type, m.content, m.created_at, m.reply_to_message_id,
              replied.sender_type AS reply_sender_type, replied.content AS reply_content
       FROM support_messages m
       LEFT JOIN support_messages replied ON replied.id = m.reply_to_message_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 100`,
    )
    .bind(conversationId)
    .all();

  return (result.results || []).reverse().map((message) => ({
    id: message.id,
    senderType: message.sender_type,
    content: message.content,
    createdAt: message.created_at,
    replyToMessageId: message.reply_to_message_id,
    replyToSenderType: message.reply_sender_type,
    replyToContent: message.reply_content,
  }));
}

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to contact support." }, { status: 401 });
    }

    const conversation = await database
      .prepare("SELECT id FROM support_conversations WHERE user_id = ? LIMIT 1")
      .bind(user.id)
      .first();
    if (!conversation) {
      return NextResponse.json({ success: true, conversationId: null, messages: [] });
    }

    await database
      .prepare(
        `UPDATE support_messages
         SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE conversation_id = ? AND sender_type = 'admin' AND read_at IS NULL`,
      )
      .bind(conversation.id)
      .run();

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      messages: await getSupportMessages(database, conversation.id),
    });
  } catch (error) {
    console.error("Loading support conversation failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load your support conversation." }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const validation = validateSupportMessage(body);
  if (validation.error) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }
  const content = validation.value;

  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to contact support." }, { status: 401 });
    }

    await database
      .prepare("INSERT OR IGNORE INTO support_conversations (id, user_id) VALUES (?, ?)")
      .bind(crypto.randomUUID(), user.id)
      .run();

    const conversation = await database
      .prepare("SELECT id FROM support_conversations WHERE user_id = ? LIMIT 1")
      .bind(user.id)
      .first();
    if (!conversation) {
      throw new Error("Support conversation could not be created.");
    }

    if (validation.replyToMessageId) {
      const replyTarget = await database
        .prepare("SELECT id FROM support_messages WHERE id = ? AND conversation_id = ? LIMIT 1")
        .bind(validation.replyToMessageId, conversation.id)
        .first();
      if (!replyTarget) {
        return NextResponse.json({ success: false, error: "The message to reply to was not found." }, { status: 404 });
      }
    }

    const messageId = crypto.randomUUID();
    await database.batch([
      database
        .prepare(
          "INSERT INTO support_messages (id, conversation_id, sender_type, content, reply_to_message_id) VALUES (?, ?, 'user', ?, ?)",
        )
        .bind(messageId, conversation.id, content, validation.replyToMessageId),
      database
        .prepare("UPDATE support_conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
        .bind(conversation.id),
    ]);

    const message = await database
      .prepare(
        `SELECT m.created_at, m.reply_to_message_id, replied.sender_type AS reply_sender_type,
                replied.content AS reply_content
         FROM support_messages m
         LEFT JOIN support_messages replied ON replied.id = m.reply_to_message_id
         WHERE m.id = ? LIMIT 1`,
      )
      .bind(messageId)
      .first();
    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: {
        id: messageId,
        senderType: "user",
        content,
        createdAt: message.created_at,
        replyToMessageId: message.reply_to_message_id,
        replyToSenderType: message.reply_sender_type,
        replyToContent: message.reply_content,
      },
    });
  } catch (error) {
    console.error("Sending support message failed:", error);
    return NextResponse.json({ success: false, error: "Unable to send your support message." }, { status: 500 });
  }
}
