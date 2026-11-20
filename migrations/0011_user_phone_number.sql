ALTER TABLE users ADD COLUMN phone_number TEXT
  CHECK (phone_number IS NULL OR length(phone_number) <= 32);
