const CHECK_INTERVAL_MS = 72 * 60 * 60 * 1000;
const MAX_CHECKS_PER_RUN = 8;
const MAX_CONCURRENT_CHECKS = 4;
const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 8_000;

const CLOSED_APPLICATION_PATTERNS = [
  /\bthis (?:job|position|role|vacancy|requisition) (?:is|has been|was) (?:now )?(?:closed|filled|expired)\b/,
  /\b(?:the )?(?:application )?deadline (?:has passed|is over|has expired|has ended)\b/,
  /\b(?:the )?last date to apply (?:has passed|is over|has expired)\b/,
  /\bapplications? for (?:this|the) (?:job|position|role) (?:are|have been|has been) (?:now )?(?:closed|ended)\b/,
  /\b(?:we are|this (?:job|position|role) is) no longer accepting applications(?: for (?:this|the) (?:job|position|role))?\b/,
  /\bapplications? (?:are|is) no longer being accepted\b/,
  /\bno longer accepting applications for (?:this|the) (?:job|position|role)\b/,
  /\bthis (?:job|position|role) is no longer available\b/,
];

function parsePublicHttpUrl(value) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (
    (url.protocol !== "http:" && url.protocol !== "https:")
    || url.username
    || url.password
    || !hostname
    || hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    || hostname.includes(":")
  ) {
    throw new Error("Application URL is not a public HTTP(S) address.");
  }
  return url;
}

async function readLimitedText(response) {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (byteLength < MAX_RESPONSE_BYTES) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const remaining = MAX_RESPONSE_BYTES - byteLength;
      const chunk = value.subarray(0, remaining);
      chunks.push(chunk);
      byteLength += chunk.byteLength;
      if (chunk.byteLength < value.byteLength) {
        break;
      }
    }
    if (byteLength >= MAX_RESPONSE_BYTES) {
      await reader.cancel();
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function containsClosedApplicationMessage(body) {
  const visibleText = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return CLOSED_APPLICATION_PATTERNS.some((pattern) => pattern.test(visibleText));
}

async function applicationIsClosed(applicationUrl, fetchImpl) {
  let url = parsePublicHttpUrl(applicationUrl);
  const initialProtocol = url.protocol;
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchImpl(url.href, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "text/html, text/plain;q=0.9" },
      signal,
    });

    if (response.status === 404 || response.status === 410) {
      return true;
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        return false;
      }
      const redirectUrl = parsePublicHttpUrl(new URL(location, url).href);
      if (initialProtocol === "https:" && redirectUrl.protocol !== "https:") {
        return false;
      }
      url = redirectUrl;
      continue;
    }

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (
      !contentType.includes("text/html")
      && !contentType.includes("text/plain")
      && !contentType.includes("application/xhtml+xml")
    ) {
      return false;
    }

    return containsClosedApplicationMessage(await readLimitedText(response));
  }

  return false;
}

async function checkAndRescheduleJob(database, job, checkedAt, nextCheckAt, fetchImpl) {
  let isClosed = false;
  try {
    isClosed = await applicationIsClosed(job.applicationUrl, fetchImpl);
  } catch (error) {
    console.error("Checking a job application page failed:", job.id, error);
  }

  await database
    .prepare(
      `UPDATE jobs
       SET next_application_check_at = ?,
           expired_at = CASE WHEN ? = 1 THEN ? ELSE expired_at END,
           updated_at = ?
       WHERE id = ?
         AND status = 'published'
         AND expired_at IS NULL`,
    )
    .bind(nextCheckAt, isClosed ? 1 : 0, checkedAt, checkedAt, job.id)
    .run();
  return isClosed;
}

export async function checkDueApplicationJobs(
  database,
  { scheduledAt = Date.now(), fetchImpl = globalThis.fetch } = {},
) {
  const runAt = new Date(scheduledAt);
  if (Number.isNaN(runAt.getTime())) {
    throw new Error("The scheduled check time is invalid.");
  }

  const checkedAt = runAt.toISOString();
  const nextCheckAt = new Date(runAt.getTime() + CHECK_INTERVAL_MS).toISOString();
  const result = await database
    .prepare(
      `SELECT id, application_url AS applicationUrl
       FROM jobs
       WHERE status = 'published'
         AND expired_at IS NULL
         AND next_application_check_at <= ?
       ORDER BY next_application_check_at ASC
       LIMIT ?`,
    )
    .bind(checkedAt, MAX_CHECKS_PER_RUN)
    .all();
  if (!Array.isArray(result.results)) {
    throw new Error("The application status query returned an invalid result set.");
  }

  let expired = 0;
  for (let offset = 0; offset < result.results.length; offset += MAX_CONCURRENT_CHECKS) {
    const batch = result.results.slice(offset, offset + MAX_CONCURRENT_CHECKS);
    const batchResults = await Promise.all(
      batch.map((job) => checkAndRescheduleJob(
        database,
        job,
        checkedAt,
        nextCheckAt,
        fetchImpl,
      )),
    );
    expired += batchResults.filter(Boolean).length;
  }

  return { checked: result.results.length, expired };
}
