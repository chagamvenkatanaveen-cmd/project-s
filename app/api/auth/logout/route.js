import { NextResponse } from "next/server";
import {
  hashSessionToken,
  readSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "@/lib/adminAuth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const token = readSessionToken(request);
    if (token) {
      const database = getDatabase();
      await database
        .prepare("DELETE FROM user_sessions WHERE token_hash = ?")
        .bind(await hashSessionToken(token))
        .run();
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("slipcord_session", "", sessionCookieOptions(request, 0));
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      "",
      adminSessionCookieOptions(request, 0),
    );
    return response;
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json({ success: false, error: "Unable to sign out right now." }, { status: 500 });
  }
}
