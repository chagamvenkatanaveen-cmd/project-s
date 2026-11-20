const STUDY_MATERIAL_FIELDS = `id,
  title,
  description,
  url,
  topic_id AS topicId,
  created_at AS createdAt,
  updated_at AS updatedAt`;

export async function listStudyMaterials(database) {
  const result = await database
    .prepare(
      `SELECT ${STUDY_MATERIAL_FIELDS}
       FROM study_materials
       ORDER BY created_at DESC
       LIMIT 200`,
    )
    .all();
  if (!Array.isArray(result.results)) {
    throw new Error("The study materials query returned an invalid result set.");
  }
  return result.results;
}

export async function createStudyMaterial(database, values) {
  const id = crypto.randomUUID();
  await database
    .prepare(
      `INSERT INTO study_materials (id, title, description, url, topic_id)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, values.title, values.description, values.url, values.topicId || null)
    .run();
  return database
    .prepare(`SELECT ${STUDY_MATERIAL_FIELDS} FROM study_materials WHERE id = ?`)
    .bind(id)
    .first();
}

export async function updateStudyMaterial(database, id, values) {
  await database
    .prepare(
      `UPDATE study_materials
       SET title = ?, description = ?, url = ?, topic_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    )
    .bind(values.title, values.description, values.url, values.topicId || null, id)
    .run();
  return database
    .prepare(`SELECT ${STUDY_MATERIAL_FIELDS} FROM study_materials WHERE id = ?`)
    .bind(id)
    .first();
}

export async function deleteStudyMaterial(database, id) {
  await database
    .prepare("DELETE FROM study_materials WHERE id = ?")
    .bind(id)
    .run();
}
