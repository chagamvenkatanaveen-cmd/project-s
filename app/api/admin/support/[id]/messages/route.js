import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";
import { validateSupportMessage } from "@/lib/supportValidation";

export const dynamic = "force-dynamic";

async function authorizeAdmin(database, request) {
  const { configured, user } = await getCurrentAdmin(database, request);
  if (!configured) {
    return { response: NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 }) };
  }
  if (!user) {
    return { response: NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function GET(request, { params }) {
  try {
    const database = await getDatabaseAsync();
    const authorization = await authorizeAdmin(database, request);
    if (authorization.response) {
      return authorization.response;
    }

    const { id } = await params;
    const conversation = await database
      .prepare("SELECT id FROM support_conversations WHERE id = ? LIMIT 1")
      .bind(id)
      .first();
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Support conversation not found." }, { status: 404 });
    }

    await database
      .prepare(
        `UPDATE support_messages
         SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE conversation_id = ? AND sender_type = 'user' AND read_at IS NULL`,
      )
      .bind(id)
      .run();

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
      .bind(id)
      .all();

    return NextResponse.json({
      success: true,
      messages: (result.results || []).reverse().map((message) => ({
        id: message.id,
        senderType: message.sender_type,
        content: message.content,
        createdAt: message.created_at,
        replyToMessageId: message.reply_to_message_id,
        replyToSenderType: message.reply_sender_type,
        replyToContent: message.reply_content,
      })),
    });
  } catch (error) {
    console.error("Loading support messages failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load support messages." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
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
    const authorization = await authorizeAdmin(database, request);
    if (authorization.response) {
      return authorization.response;
    }

    const { id } = await params;
    if (validation.replyToMessageId) {
      const replyTarget = await database
        .prepare("SELECT id FROM support_messages WHERE id = ? AND conversation_id = ? LIMIT 1")
        .bind(validation.replyToMessageId, id)
        .first();
      if (!replyTarget) {
        return NextResponse.json({ success: false, error: "The message to reply to was not found." }, { status: 404 });
      }
    }

    const messageId = crypto.randomUUID();
    const result = await database.batch([
      database
        .prepare(
          `INSERT INTO support_messages (id, conversation_id, sender_type, content, reply_to_message_id)
           SELECT ?, id, 'admin', ?, ? FROM support_conversations WHERE id = ?`,
        )
        .bind(messageId, content, validation.replyToMessageId, id),
      database
        .prepare(
          "UPDATE support_conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
        )
        .bind(id),
    ]);

    if (!result[0]?.meta?.changes) {
      return NextResponse.json({ success: false, error: "Support conversation not found." }, { status: 404 });
    }

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
      message: {
        id: messageId,
        senderType: "admin",
        content,
        createdAt: message.created_at,
        replyToMessageId: message.reply_to_message_id,
        replyToSenderType: message.reply_sender_type,
        replyToContent: message.reply_content,
      },
    });
  } catch (error) {
    console.error("Sending support reply failed:", error);
    return NextResponse.json({ success: false, error: "Unable to send the support reply." }, { status: 500 });
  }
}
