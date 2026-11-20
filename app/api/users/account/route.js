import { NextResponse } from "next/server";
import { getCurrentUser, readSessionToken } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { hasPersonalSettingsAccess } from "@/lib/personalSettingsAccess";
import { isValidUsername } from "@/lib/usernameValidation";

export const dynamic = "force-dynamic";

function validateAccount(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid account details object is required." };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const handle = typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || name.length > 80) {
    return { error: "Name must be between 1 and 80 characters." };
  }
  if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
    return { error: "Username must be 3–24 characters: letters, numbers, or underscores." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }

  return { value: { name, handle, email } };
}

async function findAccountConflict(database, userId, handle, email) {
  const [handleOwner, emailOwner] = await Promise.all([
    database
      .prepare("SELECT id FROM users WHERE handle = ? AND id != ? LIMIT 1")
      .bind(handle, userId)
      .first(),
    database
      .prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1")
      .bind(email, userId)
      .first(),
  ]);

  if (handleOwner) {
    return { error: "That username is already taken.", field: "handle" };
  }
  if (emailOwner) {
    return { error: "That email address is already in use.", field: "email" };
  }
  return null;
}

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to update your account." }, { status: 401 });
    }
    if (!(await hasPersonalSettingsAccess(request, user.id, readSessionToken(request)))) {
      return NextResponse.json(
        {
          success: false,
          requiresPassword: true,
          error: "Confirm your password to access Personal Settings.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      account: { name: user.name, handle: user.handle, email: user.email },
    });
  } catch (error) {
    console.error("Account lookup failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load your account details." }, { status: 500 });
  }
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const validation = validateAccount(body);
  if (validation.error) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to update your account." }, { status: 401 });
    }
    if (!(await hasPersonalSettingsAccess(request, user.id, readSessionToken(request)))) {
      return NextResponse.json(
        {
          success: false,
          requiresPassword: true,
          error: "Confirm your password to access Personal Settings.",
        },
        { status: 403 },
      );
    }

    const { name, handle, email } = validation.value;
    if (handle !== user.handle && !isValidUsername(handle)) {
      return NextResponse.json(
        { success: false, error: "A new username must be 8–24 characters: letters, numbers, or underscores." },
        { status: 400 },
      );
    }
    const conflict = await findAccountConflict(database, user.id, handle, email);
    if (conflict) {
      return NextResponse.json({ success: false, ...conflict }, { status: 409 });
    }

    try {
      await database
        .prepare(
          `UPDATE users
           SET display_name = ?, handle = ?, email = ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?`,
        )
        .bind(name, handle, email, user.id)
        .run();
    } catch (updateError) {
      const concurrentConflict = await findAccountConflict(database, user.id, handle, email);
      if (concurrentConflict) {
        return NextResponse.json({ success: false, ...concurrentConflict }, { status: 409 });
      }
      throw updateError;
    }

    return NextResponse.json({ success: true, account: { name, handle, email } });
  } catch (error) {
    console.error("Account update failed:", error);
    return NextResponse.json({ success: false, error: "Unable to save your account details." }, { status: 500 });
  }
}
