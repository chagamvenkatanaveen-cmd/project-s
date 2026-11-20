import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to view notifications." }, { status: 401 });
    }

    const result = await database
      .prepare(
        `SELECT notifications.id, notifications.type, notifications.post_id,
                notifications.comment_id, notifications.message_id,
                notifications.created_at, notifications.read_at,
                users.id AS actor_id, users.handle AS actor_handle,
                users.display_name AS actor_name
         FROM notifications
         LEFT JOIN users ON users.id = notifications.actor_id
         WHERE notifications.recipient_id = ?
         ORDER BY notifications.created_at DESC
         LIMIT 100`,
      )
      .bind(user.id)
      .all();

    const notifications = (result.results || []).map((item) => ({
      id: item.id,
      type: item.type,
      postId: item.post_id,
      commentId: item.comment_id,
      messageId: item.message_id,
      createdAt: item.created_at,
      readAt: item.read_at,
      actor: item.actor_id
        ? { id: item.actor_id, handle: item.actor_handle, name: item.actor_name }
        : null,
    }));
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Loading notifications failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load notifications." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to update notifications." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
    }
    const notificationId =
      typeof body?.notificationId === "string" ? body.notificationId.trim() : "";
    const now = new Date().toISOString();
    const statement = notificationId
      ? database
          .prepare(
            "UPDATE notifications SET read_at = ? WHERE id = ? AND recipient_id = ? AND read_at IS NULL",
          )
          .bind(now, notificationId, user.id)
      : database
          .prepare("UPDATE notifications SET read_at = ? WHERE recipient_id = ? AND read_at IS NULL")
          .bind(now, user.id);
    const result = await statement.run();
    return NextResponse.json({ success: true, updated: result.meta.changes });
  } catch (error) {
    console.error("Updating notifications failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update notifications." }, { status: 500 });
  }
}
