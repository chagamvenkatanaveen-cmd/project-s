const COMPANY_SELECT = `SELECT id, name, created_at AS createdAt
  FROM companies`;

export async function listCompanies(database) {
  const result = await database
    .prepare(`${COMPANY_SELECT} ORDER BY name COLLATE NOCASE`)
    .all();
  if (!Array.isArray(result.results)) {
    throw new Error("The companies query returned an invalid result set.");
  }
  return result.results;
}

export async function getCompanyById(database, id) {
  return database
    .prepare(`${COMPANY_SELECT} WHERE id = ? LIMIT 1`)
    .bind(id)
    .first();
}

export async function createCompany(database, name) {
  const existing = await database
    .prepare(`${COMPANY_SELECT} WHERE name = ? COLLATE NOCASE LIMIT 1`)
    .bind(name)
    .first();
  if (existing) {
    return { company: existing, created: false };
  }

  const id = crypto.randomUUID();
  try {
    await database
      .prepare("INSERT INTO companies (id, name) VALUES (?, ?)")
      .bind(id, name)
      .run();
  } catch (error) {
    const duplicate = await database
      .prepare(`${COMPANY_SELECT} WHERE name = ? COLLATE NOCASE LIMIT 1`)
      .bind(name)
      .first();
    if (duplicate) {
      return { company: duplicate, created: false };
    }
    throw error;
  }

  const company = await getCompanyById(database, id);
  if (!company) {
    throw new Error("The company could not be reloaded after creation.");
  }
  return { company, created: true };
}
