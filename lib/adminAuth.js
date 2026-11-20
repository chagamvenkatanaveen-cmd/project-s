import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCurrentUser, PASSWORD_ITERATIONS } from "@/lib/auth";

export const ADMIN_SESSION_COOKIE = "slipcord_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

export async function getConfiguredAdminEmail() {
  const context = await getCloudflareContext({ async: true });
  const email = context.env.ADMIN_EMAIL;
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export async function getConfiguredAdminPassword() {
  const context = await getCloudflareContext({ async: true });
  const hash = context.env.ADMIN_PASSWORD_HASH;
  const salt = context.env.ADMIN_PASSWORD_SALT;

  if (!hash && !salt) {
    return null;
  }
  if (typeof hash !== "string" || !hash || typeof salt !== "string" || !salt) {
    throw new Error("ADMIN_PASSWORD_HASH and ADMIN_PASSWORD_SALT must both be configured.");
  }

  return {
    password_hash: hash,
    password_salt: salt,
    password_iterations: PASSWORD_ITERATIONS,
  };
}

export async function getConfiguredAdminSessionSecret() {
  const context = await getCloudflareContext({ async: true });
  const secret = context.env.ADMIN_SESSION_SECRET;
  return typeof secret === "string" ? secret : "";
}

export async function createAdminSessionToken(email, secret) {
  const payload = encodeBase64Url(
    encoder.encode(
      JSON.stringify({
        email,
        expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
        nonce: crypto.randomUUID(),
      }),
    ),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSessionToken(token, email, secret) {
  if (!token || token.length > 4096) {
    return false;
  }

  const [payload, encodedSignature, ...extraParts] = token.split(".");
  if (!payload || !encodedSignature || extraParts.length > 0) {
    return false;
  }

  let payloadBytes;
  let signature;
  let session;
  try {
    payloadBytes = decodeBase64Url(payload);
    signature = decodeBase64Url(encodedSignature);
    session = JSON.parse(decoder.decode(payloadBytes));
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const isSigned = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(payload),
  );
  return isSigned
    && session.email === email
    && Number.isFinite(session.expiresAt)
    && session.expiresAt > Date.now();
}

export function readAdminSessionToken(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  return cookie ? cookie.slice(ADMIN_SESSION_COOKIE.length + 1) : null;
}

export function adminSessionCookieOptions(request, maxAge = ADMIN_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export async function getCurrentAdmin(database, request) {
  const adminEmail = await getConfiguredAdminEmail();
  if (!adminEmail) {
    return { configured: false, user: null };
  }

  const sessionSecret = await getConfiguredAdminSessionSecret();
  const adminSessionToken = readAdminSessionToken(request);
  if (
    sessionSecret
    && await verifyAdminSessionToken(adminSessionToken, adminEmail, sessionSecret)
  ) {
    return {
      configured: true,
      user: { email: adminEmail, handle: "admin", name: "Admin" },
    };
  }

  if (!database) {
    return { configured: true, user: null };
  }

  const user = await getCurrentUser(database, request);
  if (!user || user.email.toLowerCase() !== adminEmail) {
    return { configured: true, user: null };
  }

  return { configured: true, user };
}
