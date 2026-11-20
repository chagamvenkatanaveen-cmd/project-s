ALTER TABLE users ADD COLUMN password_scheme TEXT NOT NULL DEFAULT 'pbkdf2-v1'
  CHECK (password_scheme IN ('pbkdf2-v1', 'scrypt-v1'));
