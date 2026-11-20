import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashPassword,
  PASSWORD_HASH_SCHEME,
  PASSWORD_ITERATIONS,
  verifyPassword,
} from "../lib/auth.js";

test("password hashes can be created and verified", async () => {
  const password = "test-password-123";
  const credentials = await hashPassword(password);
  const user = {
    password_hash: credentials.hash,
    password_salt: credentials.salt,
    password_iterations: PASSWORD_ITERATIONS,
    password_scheme: credentials.scheme,
  };

  assert.equal(await verifyPassword(password, user), true);
  assert.equal(await verifyPassword("different-password", user), false);
});

test("legacy PBKDF2 hashes require a password reset", async () => {
  const credentials = await hashPassword("test-password-123");
  assert.equal(
    await verifyPassword("test-password-123", {
      ...credentials,
      password_scheme: "pbkdf2-v1",
    }),
    false,
  );
  assert.equal(credentials.scheme, PASSWORD_HASH_SCHEME);
});
