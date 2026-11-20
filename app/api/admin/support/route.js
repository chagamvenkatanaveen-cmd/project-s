import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const { configured, user } = await getCurrentAdmin(database, request);
    if (!configured) {
      return NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 });
    }

    const result = await database
      .prepare(
        `SELECT c.id, c.updated_at, u.handle AS user_handle, u.display_name AS user_name,
                m.content AS last_message, m.sender_type AS last_sender_type,
                (SELECT COUNT(*) FROM support_messages unread
                 WHERE unread.conversation_id = c.id
                   AND unread.sender_type = 'user' AND unread.read_at IS NULL) AS unread_count
         FROM support_conversations c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN support_messages m ON m.id = (
           SELECT latest.id FROM support_messages latest
           WHERE latest.conversation_id = c.id
           ORDER BY latest.created_at DESC, latest.id DESC
           LIMIT 1
         )
         ORDER BY c.updated_at DESC, c.id DESC
         LIMIT 200`,
      )
      .all();

    return NextResponse.json({
      success: true,
      conversations: (result.results || []).map((conversation) => ({
        id: conversation.id,
        updatedAt: conversation.updated_at,
        userHandle: conversation.user_handle,
        userName: conversation.user_name,
        lastMessage: conversation.last_message || "",
        lastSenderType: conversation.last_sender_type || "",
        unreadCount: Number(conversation.unread_count) || 0,
      })),
    });
  } catch (error) {
    console.error("Loading admin support inbox failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load the support inbox." }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId || userId.length > 200) {
    return NextResponse.json({ success: false, error: "Choose a valid user." }, { status: 400 });
  }

  try {
    const database = await getDatabaseAsync();
    const { configured, user: admin } = await getCurrentAdmin(database, request);
    if (!configured) {
      return NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 });
    }
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 });
    }

    const targetUser = await database
      .prepare("SELECT id FROM users WHERE id = ? LIMIT 1")
      .bind(userId)
      .first();
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    await database
      .prepare("INSERT OR IGNORE INTO support_conversations (id, user_id) VALUES (?, ?)")
      .bind(crypto.randomUUID(), userId)
      .run();

    const conversation = await database
      .prepare(
        `SELECT c.id, c.updated_at, u.handle AS user_handle, u.display_name AS user_name,
                m.content AS last_message, m.sender_type AS last_sender_type,
                (SELECT COUNT(*) FROM support_messages unread
                 WHERE unread.conversation_id = c.id
                   AND unread.sender_type = 'user' AND unread.read_at IS NULL) AS unread_count
         FROM support_conversations c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN support_messages m ON m.id = (
           SELECT latest.id FROM support_messages latest
           WHERE latest.conversation_id = c.id
           ORDER BY latest.created_at DESC, latest.id DESC
           LIMIT 1
         )
         WHERE c.user_id = ?
         LIMIT 1`,
      )
      .bind(userId)
      .first();
    if (!conversation) {
      throw new Error("Support conversation could not be created.");
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        updatedAt: conversation.updated_at,
        userHandle: conversation.user_handle,
        userName: conversation.user_name,
        lastMessage: conversation.last_message || "",
        lastSenderType: conversation.last_sender_type || "",
        unreadCount: Number(conversation.unread_count) || 0,
      },
    });
  } catch (error) {
    console.error("Creating admin support conversation failed:", error);
    return NextResponse.json({ success: false, error: "Unable to start a conversation." }, { status: 500 });
  }
}
