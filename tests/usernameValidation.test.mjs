import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidUsername } from "../lib/usernameValidation.js";

test("new usernames must contain 8–24 letters, numbers, or underscores", () => {
  assert.equal(isValidUsername("student8"), true);
  assert.equal(isValidUsername("a".repeat(24)), true);
  assert.equal(isValidUsername("student"), false);
  assert.equal(isValidUsername("a".repeat(25)), false);
  assert.equal(isValidUsername("student-8"), false);
});
