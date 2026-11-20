ALTER TABLE applied_jobs ADD COLUMN got_interview INTEGER NOT NULL DEFAULT 0
  CHECK (got_interview IN (0, 1));
