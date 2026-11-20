export function validateSupportMessage(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid message is required." };
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 4000) {
    return { error: "Message must be between 1 and 4000 characters." };
  }

  let replyToMessageId = null;
  if (body.replyToMessageId !== undefined && body.replyToMessageId !== null) {
    if (typeof body.replyToMessageId !== "string") {
      return { error: "Choose a valid message to reply to." };
    }
    replyToMessageId = body.replyToMessageId.trim() || null;
    if (replyToMessageId && replyToMessageId.length > 128) {
      return { error: "Choose a valid message to reply to." };
    }
  }

  return { value: content, replyToMessageId };
}

export function validateJobReport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid job report is required." };
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!jobId || jobId.length > 128) {
    return { error: "A valid job ID is required." };
  }
  if (!["filled", "closed", "other"].includes(reason)) {
    return { error: "Choose a valid report reason." };
  }
  if (
    (body.message !== undefined && typeof body.message !== "string")
    || message.length > 2000
    || (reason === "other" && !message)
  ) {
    return {
      error: reason === "other"
        ? "Add a message for an other issue."
        : "Message must be 2000 characters or fewer.",
    };
  }

  return { value: { jobId, reason, message } };
}
