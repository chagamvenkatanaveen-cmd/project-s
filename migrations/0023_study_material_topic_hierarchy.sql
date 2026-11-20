ALTER TABLE study_material_topics ADD COLUMN link TEXT NOT NULL DEFAULT '';
ALTER TABLE study_material_topics ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE study_material_topics ADD COLUMN parent_id TEXT REFERENCES study_material_topics(id) ON DELETE CASCADE;

CREATE INDEX study_material_topics_parent_id_idx
  ON study_material_topics(parent_id);
