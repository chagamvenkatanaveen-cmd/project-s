import assert from "node:assert/strict";
import { test } from "node:test";
import { validateJobReport, validateSupportMessage } from "../lib/supportValidation.js";

test("support messages must contain 1 to 4000 non-whitespace characters", () => {
  assert.equal(validateSupportMessage({ content: "  " }).error, "Message must be between 1 and 4000 characters.");
  assert.equal(validateSupportMessage({ content: "x".repeat(4001) }).error, "Message must be between 1 and 4000 characters.");
  assert.equal(validateSupportMessage({ content: "  Please help  " }).value, "Please help");
});

test("support replies accept an optional message ID and reject invalid IDs", () => {
  assert.equal(validateSupportMessage({ content: "Thanks", replyToMessageId: " message-1 " }).replyToMessageId, "message-1");
  assert.equal(validateSupportMessage({ content: "Thanks" }).replyToMessageId, null);
  assert.equal(
    validateSupportMessage({ content: "Thanks", replyToMessageId: "x".repeat(129) }).error,
    "Choose a valid message to reply to.",
  );
  assert.equal(
    validateSupportMessage({ content: "Thanks", replyToMessageId: 123 }).error,
    "Choose a valid message to reply to.",
  );
});

test("job reports require a valid job, reason, and details for other issues", () => {
  assert.equal(validateJobReport({ jobId: "job-1", reason: "closed" }).value.message, "");
  assert.equal(
    validateJobReport({ jobId: "job-1", reason: "other", message: "  " }).error,
    "Add a message for an other issue.",
  );
  assert.equal(
    validateJobReport({ jobId: "job-1", reason: "filled", message: "x".repeat(2001) }).error,
    "Message must be 2000 characters or fewer.",
  );
  assert.deepEqual(
    validateJobReport({ jobId: " job-1 ", reason: "other", message: " check link " }).value,
    { jobId: "job-1", reason: "other", message: "check link" },
  );
});
