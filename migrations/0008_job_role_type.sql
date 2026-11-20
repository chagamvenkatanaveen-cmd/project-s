ALTER TABLE jobs
ADD COLUMN role_type TEXT
  CHECK (role_type IS NULL OR length(trim(role_type)) BETWEEN 1 AND 160);
