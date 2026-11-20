import { NextResponse } from "next/server";
import { hashPassword, PASSWORD_ITERATIONS } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { isValidPassword } from "@/lib/passwordValidation";
import { isValidUsername } from "@/lib/usernameValidation";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const handle = typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 80) {
    return NextResponse.json({ success: false, error: "Name must be between 1 and 80 characters." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isValidUsername(handle)) {
    return NextResponse.json(
      { success: false, error: "Username must be 8–24 characters: letters, numbers, or underscores." },
      { status: 400 },
    );
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ success: false, error: "Password must be 9–128 characters." }, { status: 400 });
  }
  try {
    const database = getDatabase();
    const existing = await database
      .prepare("SELECT id FROM users WHERE email = ? OR handle = ? LIMIT 1")
      .bind(email, handle)
      .first();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "That email or username is already registered." },
        { status: 409 },
      );
    }

    const userId = crypto.randomUUID();
    const { hash, salt } = await hashPassword(password);
    const userInsert = database
      .prepare(
        `INSERT INTO users
          (id, email, handle, display_name, password_hash, password_salt, password_iterations, account_status, approval_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'deactivated', 'approved')`,
      )
      .bind(userId, email, handle, name, hash, salt, PASSWORD_ITERATIONS);
    await userInsert.run();

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: "Your account was created and is awaiting admin activation.",
      user: { id: userId, email, handle, name },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ success: false, error: "Unable to create the account." }, { status: 500 });
  }
}
