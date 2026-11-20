ALTER TABLE jobs ADD COLUMN next_application_check_at TEXT;
ALTER TABLE jobs ADD COLUMN expired_at TEXT;

UPDATE jobs
SET next_application_check_at = strftime(
  '%Y-%m-%dT%H:%M:%fZ',
  created_at,
  '+72 hours'
)
WHERE next_application_check_at IS NULL;

CREATE INDEX jobs_application_expiry_check_idx
  ON jobs(status, expired_at, next_application_check_at);