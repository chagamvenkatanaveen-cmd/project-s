import { NextResponse } from "next/server";
import {
  getCurrentUser,
  PASSWORD_HASH_SCHEME,
  readSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import {
  createPersonalSettingsAccessToken,
  getPersonalSettingsAccessCookieOptions,
  PERSONAL_SETTINGS_ACCESS_COOKIE,
} from "@/lib/personalSettingsAccess";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Enter your current password." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, error: "Enter your current password." },
      { status: 400 },
    );
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password || password.length > 128) {
    return NextResponse.json(
      { success: false, error: "Enter your current password." },
      { status: 400 },
    );
  }

  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in to continue." },
        { status: 401 },
      );
    }

    const credentials = await database
      .prepare(
        `SELECT password_hash, password_salt, password_iterations, password_scheme
         FROM users WHERE id = ? LIMIT 1`,
      )
      .bind(user.id)
      .first();
    if (!credentials) {
      return NextResponse.json(
        { success: false, error: "The password you entered is incorrect." },
        { status: 403 },
      );
    }
    if (credentials.password_scheme !== PASSWORD_HASH_SCHEME) {
      return NextResponse.json(
        { success: false, error: "An admin must reset your password before you can continue." },
        { status: 403 },
      );
    }
    if (!(await verifyPassword(password, credentials))) {
      return NextResponse.json(
        { success: false, error: "The password you entered is incorrect." },
        { status: 403 },
      );
    }

    const sessionToken = readSessionToken(request);
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Sign in to continue." },
        { status: 401 },
      );
    }
    const accessToken = await createPersonalSettingsAccessToken(user.id, sessionToken);
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      PERSONAL_SETTINGS_ACCESS_COOKIE,
      accessToken,
      getPersonalSettingsAccessCookieOptions(request),
    );
    return response;
  } catch (error) {
    console.error("Personal settings password verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify your password right now." },
      { status: 500 },
    );
  }
}
