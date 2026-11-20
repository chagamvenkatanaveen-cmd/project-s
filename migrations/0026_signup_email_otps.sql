CREATE TABLE signup_email_otps (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  resend_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
    CHECK (attempts >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX signup_email_otps_expires_at_idx
  ON signup_email_otps(expires_at);
