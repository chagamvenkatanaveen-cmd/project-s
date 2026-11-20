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
        `SELECT COUNT(*) AS count
         FROM support_messages
         WHERE sender_type = 'user' AND read_at IS NULL`,
      )
      .first();
    return NextResponse.json({ success: true, count: Number(result?.count) || 0 });
  } catch (error) {
    console.error("Loading unread support count failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load new support notifications." }, { status: 500 });
  }
}
