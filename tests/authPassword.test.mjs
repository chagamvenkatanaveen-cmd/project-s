import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, PASSWORD_ITERATIONS, verifyPassword } from "../lib/auth.js";

test("password hashes can be created and verified", async () => {
  const password = "test-password-123";
  const credentials = await hashPassword(password);
  const user = {
    password_hash: credentials.hash,
    password_salt: credentials.salt,
    password_iterations: PASSWORD_ITERATIONS,
  };

  assert.equal(await verifyPassword(password, user), true);
  assert.equal(await verifyPassword("different-password", user), false);
});

test("password verification remains compatible with existing Web Crypto hashes", async () => {
  const password = "existing-user-password";
  const salt = Uint8Array.from({ length: 16 }, (_, index) => index);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  );
  const user = {
    password_hash: Buffer.from(hash).toString("base64url"),
    password_salt: Buffer.from(salt).toString("base64url"),
    password_iterations: PASSWORD_ITERATIONS,
  };

  assert.equal(await verifyPassword(password, user), true);
});
