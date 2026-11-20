ALTER TABLE users ADD COLUMN years_experience INTEGER
  CHECK (years_experience IS NULL OR years_experience BETWEEN 0 AND 60);
ALTER TABLE users ADD COLUMN is_student INTEGER
  CHECK (is_student IS NULL OR is_student IN (0, 1));
ALTER TABLE users ADD COLUMN degree TEXT;
ALTER TABLE users ADD COLUMN branch TEXT;
ALTER TABLE users ADD COLUMN passing_year INTEGER
  CHECK (passing_year IS NULL OR passing_year BETWEEN 1950 AND 2100);
ALTER TABLE users ADD COLUMN preferred_roles TEXT;
