CREATE TABLE jobs (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  company TEXT NOT NULL CHECK (length(trim(company)) BETWEEN 1 AND 160),
  location TEXT NOT NULL CHECK (length(trim(location)) BETWEEN 1 AND 160),
  employment_type TEXT NOT NULL
    CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Temporary', 'Other')),
  work_mode TEXT NOT NULL
    CHECK (work_mode IN ('On-site', 'Hybrid', 'Remote')),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 10000),
  salary_range TEXT CHECK (salary_range IS NULL OR length(salary_range) <= 120),
  application_url TEXT CHECK (application_url IS NULL OR length(application_url) <= 2048),
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX jobs_published_created_at_idx
  ON jobs(status, created_at DESC);
