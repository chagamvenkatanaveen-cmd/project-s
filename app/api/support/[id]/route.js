import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to manage your support messages." }, { status: 401 });
    }

    const { id: messageId } = await params;
    const conversation = await database
      .prepare("SELECT id FROM support_conversations WHERE user_id = ? LIMIT 1")
      .bind(user.id)
      .first();
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Support conversation not found." }, { status: 404 });
    }

    const result = await database
      .prepare(
        "DELETE FROM support_messages WHERE id = ? AND conversation_id = ? AND sender_type = 'user'",
      )
      .bind(messageId, conversation.id)
      .run();

    if (!result.meta?.changes) {
      return NextResponse.json({ success: false, error: "Your support message was not found." }, { status: 404 });
    }

    await database
      .prepare("UPDATE support_conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
      .bind(conversation.id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deleting user support message failed:", error);
    return NextResponse.json({ success: false, error: "Unable to delete your support message." }, { status: 500 });
  }
}
