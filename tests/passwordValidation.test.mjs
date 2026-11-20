import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidPassword } from "../lib/passwordValidation.js";

test("passwords must contain 9–128 characters", () => {
  assert.equal(isValidPassword("123456789"), true);
  assert.equal(isValidPassword("12345678"), false);
  assert.equal(isValidPassword("p".repeat(128)), true);
  assert.equal(isValidPassword("p".repeat(129)), false);
  assert.equal(isValidPassword(null), false);
});
