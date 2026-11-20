import { isProfileVerified } from "@/lib/profileVerification";

export const SESSION_COOKIE = "slipcord_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const PASSWORD_ITERATIONS = 600000;

const encoder = new TextEncoder();

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: decodeBase64Url(salt),
      iterations,
    },
    key,
    256,
  );
  return new Uint8Array(derivedBits);
}

function equalBytes(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltValue = encodeBase64Url(salt);
  const hash = await derivePasswordHash(password, saltValue, PASSWORD_ITERATIONS);

  return {
    hash: encodeBase64Url(hash),
    salt: saltValue,
  };
}

export async function verifyPassword(password, user) {
  const actualHash = await derivePasswordHash(
    password,
    user.password_salt,
    user.password_iterations,
  );
  return equalBytes(actualHash, decodeBase64Url(user.password_hash));
}

export async function hashSessionToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return encodeBase64Url(new Uint8Array(digest));
}

export function readSessionToken(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  return cookie ? cookie.slice(SESSION_COOKIE.length + 1) : null;
}

export async function createSessionCredentials(userId) {
  const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  return {
    id: crypto.randomUUID(),
    userId,
    token,
    tokenHash,
    expiresAt,
  };
}

export async function createSession(database, userId) {
  const session = await createSessionCredentials(userId);
  await database
    .prepare(
      "INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(session.id, session.userId, session.tokenHash, session.expiresAt)
    .run();

  return session.token;
}

export async function getCurrentUser(database, request) {
  const token = readSessionToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = await hashSessionToken(token);
  const user = await database
    .prepare(
      `SELECT users.id, users.email, users.handle, users.display_name AS name,
              users.avatar_key AS avatarKey, users.phone_number AS phoneNumber,
              users.account_status AS accountStatus,
              users.approval_status AS approvalStatus,
              users.years_experience, users.is_student, users.degree,
              users.branch, users.passing_year
       FROM user_sessions
       JOIN users ON users.id = user_sessions.user_id
       WHERE user_sessions.token_hash = ? AND user_sessions.expires_at > ?
         AND users.approval_status = 'approved'
         AND users.account_status != 'deactivated'
       LIMIT 1`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    handle: user.handle,
    name: user.name,
    avatarKey: user.avatarKey,
    phoneNumber: user.phoneNumber,
    accountStatus: user.accountStatus,
    approvalStatus: user.approvalStatus,
    isVerified: isProfileVerified(user),
  };
}

export function sessionCookieOptions(request, maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
