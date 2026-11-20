import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getConfiguredAdminEmail,
  getConfiguredAdminPassword,
  getConfiguredAdminSessionSecret,
} from "@/lib/adminAuth";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 128) {
    return NextResponse.json({ success: false, error: "Enter your admin email and password." }, { status: 400 });
  }

  try {
    const adminEmail = await getConfiguredAdminEmail();
    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin login is not configured. Set ADMIN_EMAIL to an authorized address." },
        { status: 503 },
      );
    }

    const adminPassword = await getConfiguredAdminPassword();
    if (adminPassword) {
      const sessionSecret = await getConfiguredAdminSessionSecret();
      if (!sessionSecret) {
        return NextResponse.json(
          { success: false, error: "Admin session signing is not configured." },
          { status: 503 },
        );
      }

      if (email !== adminEmail || !(await verifyPassword(password, adminPassword))) {
        return NextResponse.json({ success: false, error: "Invalid admin email or password." }, { status: 401 });
      }

      const sessionToken = await createAdminSessionToken(adminEmail, sessionSecret);
      const response = NextResponse.json({
        success: true,
        user: { email: adminEmail, handle: "admin", name: "Admin" },
      });
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        sessionToken,
        adminSessionCookieOptions(request),
      );
      return response;
    }

    const database = getDatabase();
    const user = await database
      .prepare(
        `SELECT id, email, handle, display_name, password_hash, password_salt, password_iterations
         FROM users WHERE email = ? AND account_status != 'deactivated' LIMIT 1`,
      )
      .bind(adminEmail)
      .first();
    const passwordIsValid = user ? await verifyPassword(password, user) : false;

    if (email !== adminEmail || !passwordIsValid) {
      return NextResponse.json({ success: false, error: "Invalid admin email or password." }, { status: 401 });
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
    response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions(request));
    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ success: false, error: "Unable to sign in as admin right now." }, { status: 500 });
  }
}
