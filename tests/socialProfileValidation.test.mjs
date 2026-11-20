import assert from "node:assert/strict";
import { test } from "node:test";
import { validateProfileUrl } from "../lib/socialProfileValidation.js";

test("profile URLs are optional and normalized", () => {
  assert.deepEqual(validateProfileUrl("  ", "instagram"), { value: "" });
  assert.deepEqual(
    validateProfileUrl(" https://www.instagram.com/student ", "instagram"),
    { value: "https://www.instagram.com/student" },
  );
});

test("LinkedIn profile URLs accept official profile subdomains", () => {
  assert.deepEqual(
    validateProfileUrl("https://in.linkedin.com/in/student", "linkedin"),
    { value: "https://in.linkedin.com/in/student" },
  );
});

test("LeetCode links must use its official host and include a profile path", () => {
  assert.deepEqual(
    validateProfileUrl("https://leetcode.com/student", "leetcode"),
    { value: "https://leetcode.com/student" },
  );
  assert.ok(validateProfileUrl("https://leetcode.com/", "leetcode").error);
  assert.ok(validateProfileUrl("https://leetcode.com.example/student", "leetcode").error);
});

test("portfolio links allow any secure website, including its homepage", () => {
  assert.deepEqual(
    validateProfileUrl("https://portfolio.example", "portfolio"),
    { value: "https://portfolio.example/" },
  );
  assert.ok(validateProfileUrl("http://portfolio.example", "portfolio").error);
});

test("profile URLs reject insecure, unrelated, and root social URLs", () => {
  assert.ok(validateProfileUrl("http://instagram.com/student", "instagram").error);
  assert.ok(validateProfileUrl("https://instagram.com.example/student", "instagram").error);
  assert.ok(validateProfileUrl("https://www.linkedin.com/", "linkedin").error);
});
