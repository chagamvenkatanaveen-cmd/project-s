CREATE TABLE support_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX support_conversations_updated_at_idx
  ON support_conversations(updated_at DESC);

CREATE TABLE support_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL
    REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX support_messages_conversation_created_at_idx
  ON support_messages(conversation_id, created_at);

CREATE TABLE job_reports (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_handle TEXT NOT NULL,
  user_name TEXT NOT NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_location TEXT NOT NULL,
  application_url TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('filled', 'closed', 'other')),
  message TEXT NOT NULL DEFAULT '' CHECK (length(message) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  reviewed_at TEXT,
  reviewed_by TEXT
) STRICT;

CREATE INDEX job_reports_status_created_at_idx
  ON job_reports(status, created_at DESC);
