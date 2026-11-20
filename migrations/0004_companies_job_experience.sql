CREATE TABLE companies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE
    CHECK (length(trim(name)) BETWEEN 1 AND 160),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

INSERT OR IGNORE INTO companies (id, name)
SELECT lower(hex(randomblob(16))), MIN(trim(company))
FROM jobs
WHERE length(trim(company)) > 0
GROUP BY lower(trim(company));

ALTER TABLE jobs ADD COLUMN company_id TEXT REFERENCES companies(id) ON DELETE RESTRICT;
ALTER TABLE jobs ADD COLUMN years_experience INTEGER NOT NULL DEFAULT 0
  CHECK (years_experience BETWEEN 0 AND 60);

UPDATE jobs
SET company_id = (
  SELECT companies.id
  FROM companies
  WHERE companies.name = trim(jobs.company) COLLATE NOCASE
  LIMIT 1
)
WHERE company_id IS NULL;

CREATE INDEX jobs_company_id_idx ON jobs(company_id);

CREATE TRIGGER jobs_require_company_and_application_url
BEFORE INSERT ON jobs
FOR EACH ROW
WHEN NEW.company_id IS NULL
  OR NEW.application_url IS NULL
  OR length(trim(NEW.application_url)) = 0
BEGIN
  SELECT RAISE(ABORT, 'job_company_and_application_url_required');
END;

CREATE TRIGGER jobs_keep_company_and_application_url
BEFORE UPDATE OF company_id, application_url ON jobs
FOR EACH ROW
WHEN NEW.company_id IS NULL
  OR NEW.application_url IS NULL
  OR length(trim(NEW.application_url)) = 0
BEGIN
  SELECT RAISE(ABORT, 'job_company_and_application_url_required');
END;
