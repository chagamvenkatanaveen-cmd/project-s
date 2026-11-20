CREATE TABLE applied_jobs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, job_id)
) STRICT;

CREATE INDEX applied_jobs_user_applied_idx ON applied_jobs(user_id, applied_at DESC);
