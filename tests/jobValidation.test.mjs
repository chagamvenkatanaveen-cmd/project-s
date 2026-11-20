import assert from "node:assert/strict";
import { test } from "node:test";
import { validateJobInput } from "../lib/jobValidation.js";

const validJob = {
  title: "Software Developer",
  batch: "Batch 2026",
  companyId: "company-1",
  location: "Remote",
  employmentType: "Full-time",
  workMode: "Remote",
  candidateEligibility: "freshers",
  description: "A role description.",
  applicationUrl: "https://careers.example/jobs/1",
};

test("job batch is required and accepts text or numeric input", () => {
  const { batch, ...jobWithoutBatch } = validJob;
  assert.equal(validateJobInput(jobWithoutBatch).error, "Batch is required and must be 120 characters or fewer.");
  assert.equal(validateJobInput({ ...validJob, batch: "  Batch 2027 " }).values.batch, "Batch 2027");
  assert.equal(validateJobInput({ ...validJob, batch: 2028 }).values.batch, "2028");
  assert.equal(validateJobInput({ ...validJob, batch: " " }).error, "Batch is required and must be 120 characters or fewer.");
  assert.equal(validateJobInput({ ...validJob, batch: "x".repeat(121) }).error, "Batch is required and must be 120 characters or fewer.");
});

test("job priority defaults off and accepts a boolean selection", () => {
  assert.equal(validateJobInput(validJob).values.highPriority, false);
  assert.equal(validateJobInput({ ...validJob, highPriority: true }).values.highPriority, true);
});

test("job priority rejects non-boolean values", () => {
  assert.equal(validateJobInput({ ...validJob, highPriority: "true" }).error, "Choose whether this job is high priority.");
});
