ALTER TABLE jobs
ADD COLUMN high_priority INTEGER NOT NULL DEFAULT 0
  CHECK (high_priority IN (0, 1));
