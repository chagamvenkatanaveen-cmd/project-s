ALTER TABLE support_messages
  ADD COLUMN reply_to_message_id TEXT
  REFERENCES support_messages(id) ON DELETE SET NULL;
