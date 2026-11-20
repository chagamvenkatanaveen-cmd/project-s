CREATE TABLE jobs_new (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  company TEXT NOT NULL CHECK (length(trim(company)) BETWEEN 1 AND 160),
  location TEXT NOT NULL CHECK (length(trim(location)) BETWEEN 1 AND 160),
  employment_type TEXT NOT NULL
    CHECK (employment_type IN ('Intern', 'Full-time', 'Intern to Full-time')),
  work_mode TEXT NOT NULL
    CHECK (work_mode IN ('On-site', 'Hybrid', 'Remote')),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 10000),
  salary_range TEXT CHECK (salary_range IS NULL OR length(salary_range) <= 120),
  application_url TEXT CHECK (application_url IS NULL OR length(application_url) <= 2048),
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  company_id TEXT REFERENCES companies(id) ON DELETE RESTRICT,
  years_experience INTEGER NOT NULL DEFAULT 0
    CHECK (years_experience BETWEEN 0 AND 60),
  next_application_check_at TEXT,
  expired_at TEXT
) STRICT;

INSERT INTO jobs_new (
  id,
  title,
  company,
  location,
  employment_type,
  work_mode,
  description,
  salary_range,
  application_url,
  status,
  created_at,
  updated_at,
  company_id,
  years_experience,
  next_application_check_at,
  expired_at
)
SELECT
  id,
  title,
  company,
  location,
  employment_type,
  work_mode,
  description,
  salary_range,
  application_url,
  status,
  created_at,
  updated_at,
  company_id,
  years_experience,
  next_application_check_at,
  expired_at
FROM jobs;

DROP TABLE jobs;
ALTER TABLE jobs_new RENAME TO jobs;

CREATE INDEX jobs_published_created_at_idx
  ON jobs(status, created_at DESC);
CREATE INDEX jobs_company_id_idx ON jobs(company_id);
CREATE INDEX jobs_application_expiry_check_idx
  ON jobs(status, expired_at, next_application_check_at);

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
