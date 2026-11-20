ALTER TABLE support_messages ADD COLUMN read_at TEXT;

CREATE INDEX support_messages_unread_user_idx
  ON support_messages(sender_type, read_at, conversation_id);
