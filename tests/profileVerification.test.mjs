import assert from "node:assert/strict";
import { test } from "node:test";
import { isProfileVerified } from "../lib/profileVerification.js";

const completeProfile = {
  years_experience: 2,
  is_student: 1,
  degree: "B.Tech",
  branch: "Computer Science",
  passing_year: 2027,
};

test("a profile is verified when all required fields are complete", () => {
  assert.equal(isProfileVerified(completeProfile), true);
});

test("a profile is not verified when any required field is missing", () => {
  assert.equal(isProfileVerified({ ...completeProfile, degree: "" }), false);
  assert.equal(isProfileVerified({ ...completeProfile, is_student: null }), false);
  assert.equal(isProfileVerified(null), false);
});
