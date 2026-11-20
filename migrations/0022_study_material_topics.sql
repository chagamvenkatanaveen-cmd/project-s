CREATE TABLE study_material_topics (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

ALTER TABLE study_materials
  ADD COLUMN topic_id TEXT REFERENCES study_material_topics(id) ON DELETE SET NULL;

CREATE INDEX study_material_topics_created_at_idx
  ON study_material_topics(created_at DESC);

CREATE INDEX study_materials_topic_id_idx
  ON study_materials(topic_id);
