ALTER TABLE jobs
ADD COLUMN candidate_eligibility TEXT NOT NULL DEFAULT 'freshers'
  CHECK (candidate_eligibility IN ('freshers', 'experienced', 'student'));

UPDATE jobs
SET candidate_eligibility = 'experienced'
WHERE years_experience > 0;
