import { NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  PASSWORD_ITERATIONS,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password || password.length > 128) {
    return NextResponse.json({ success: false, error: "Enter your username or email and password." }, { status: 400 });
  }

  try {
    const database = getDatabase();
    const user = await database
      .prepare(
        `SELECT id, email, handle, display_name, password_hash, password_salt, password_iterations,
                account_status, approval_status
         FROM users
         WHERE (email = ? OR handle = ?)
         LIMIT 1`,
      )
      .bind(identifier, identifier)
      .first();

    if (!user) {
      await hashPassword(password);
      return NextResponse.json({ success: false, error: "Invalid username/email or password." }, { status: 401 });
    }

    if (user.account_status === "deactivated") {
      return NextResponse.json({ success: false, error: "This account is deactivated." }, { status: 401 });
    }
    if (user.approval_status !== "approved") {
      return NextResponse.json({ success: false, error: "Your account is awaiting admin approval." }, { status: 403 });
    }

    if (!(await verifyPassword(password, user))) {
      return NextResponse.json({ success: false, error: "Invalid username/email or password." }, { status: 401 });
    }

    const sessionToken = await createSession(database, user.id);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        name: user.display_name,
      },
    });
    response.cookies.set("slipcord_session", sessionToken, sessionCookieOptions(request));
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ success: false, error: "Unable to sign in right now." }, { status: 500 });
  }
}
