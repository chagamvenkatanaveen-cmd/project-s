import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to view support notifications." }, { status: 401 });
    }

    const result = await database
      .prepare(
        `SELECT COUNT(*) AS count
         FROM support_messages m
         JOIN support_conversations c ON c.id = m.conversation_id
         WHERE c.user_id = ? AND m.sender_type = 'admin' AND m.read_at IS NULL`,
      )
      .bind(user.id)
      .first();

    return NextResponse.json({ success: true, count: Number(result?.count) || 0 });
  } catch (error) {
    console.error("Loading support notification count failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load support notifications." }, { status: 500 });
  }
}
