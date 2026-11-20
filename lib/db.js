import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDatabase() {
  const database = getCloudflareContext().env.DB;
  if (!database) {
    throw new Error("The D1 binding 'DB' is not configured.");
  }
  return database;
}

export async function getDatabaseAsync() {
  const context = await getCloudflareContext({ async: true });
  const database = context.env.DB;
  if (!database) {
    throw new Error("The D1 binding 'DB' is not configured.");
  }
  return database;
}
