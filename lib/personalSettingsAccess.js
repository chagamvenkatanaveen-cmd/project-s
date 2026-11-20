export const PERSONAL_SETTINGS_ACCESS_COOKIE = "slipcord_personal_settings_access";
export const PERSONAL_SETTINGS_ACCESS_SECONDS = 15 * 60;

const encoder = new TextEncoder();

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : null;
}

export async function createPersonalSettingsAccessToken(userId, sessionToken, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + PERSONAL_SETTINGS_ACCESS_SECONDS;
  const payload = `${userId}:${expiresAt}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return `${expiresAt}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function hasPersonalSettingsAccess(request, userId, sessionToken, now = Date.now()) {
  const token = readCookie(request, PERSONAL_SETTINGS_ACCESS_COOKIE);
  if (!token || !sessionToken) {
    return false;
  }

  const [expiresAtValue, signatureValue, ...extraParts] = token.split(".");
  const expiresAt = Number(expiresAtValue);
  if (
    !expiresAtValue ||
    !signatureValue ||
    extraParts.length > 0 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    expiresAt > Math.floor(now / 1000) + PERSONAL_SETTINGS_ACCESS_SECONDS
  ) {
    return false;
  }

  const signature = decodeBase64Url(signatureValue);
  if (!signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(`${userId}:${expiresAt}`),
  );
}

export function getPersonalSettingsAccessCookieOptions(request) {
  return {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: "/api/users/account",
    maxAge: PERSONAL_SETTINGS_ACCESS_SECONDS,
  };
}
