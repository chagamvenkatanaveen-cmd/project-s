import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

async function authorizeAdmin(request) {
  const database = await getDatabaseAsync();
  const { configured, user } = await getCurrentAdmin(database, request);
  if (!configured) return { database, response: NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 }) };
  if (!user) return { database, response: NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 }) };
  return { database, response: null };
}

export async function GET(request) {
  try {
    const { database, response } = await authorizeAdmin(request);
    if (response) return response;
    const result = await database
      .prepare(`SELECT id, name, link, description, parent_id AS parentId, created_at AS createdAt FROM study_material_topics ORDER BY created_at DESC`)
      .all();
    return NextResponse.json({ success: true, topics: result.results || [] });
  } catch (error) {
    console.error("Loading study material topics failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load topics." }, { status: 500 });
  }
}

export async function POST(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch {
    return NextResponse.json({ success: false, error: "Unable to verify admin access." }, { status: 500 });
  }
  if (authorization.response) return authorization.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 }); }
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const link = typeof body?.link === "string" ? body.link.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const parentId = typeof body?.parentId === "string" ? body.parentId.trim() : "";
  if (!name || name.length > 120) return NextResponse.json({ success: false, error: "Topic name is required and must be 120 characters or fewer." }, { status: 400 });
  if (link.length > 2048) {
    return NextResponse.json({ success: false, error: "Link must be 2048 characters or fewer." }, { status: 400 });
  }
  if (link) {
    try {
      const parsed = new URL(link);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
    } catch {
      return NextResponse.json({ success: false, error: "Enter a valid HTTP or HTTPS link." }, { status: 400 });
    }
  }
  if (description.length > 500) {
    return NextResponse.json({ success: false, error: "Description must be 500 characters or fewer." }, { status: 400 });
  }
  try {
    const duplicate = await authorization.database
      .prepare(
        `SELECT id FROM study_material_topics
         WHERE lower(trim(name)) = lower(trim(?))
           AND ((parent_id IS NULL AND ? IS NULL) OR parent_id = ?)
         LIMIT 1`,
      )
      .bind(name, parentId || null, parentId || null)
      .first();
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "A topic with this name already exists here." },
        { status: 409 },
      );
    }
    if (parentId) {
      const parent = await authorization.database
        .prepare(`SELECT id, name, parent_id AS parentId FROM study_material_topics WHERE id = ?`)
        .bind(parentId)
        .first();
      if (!parent) {
        return NextResponse.json({ success: false, error: "Choose a valid parent topic." }, { status: 400 });
      }
      if (parent.name.trim().toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: "A topic cannot have the same name as its parent." },
          { status: 409 },
        );
      }
    }
    const id = crypto.randomUUID();
    await authorization.database
      .prepare(`INSERT INTO study_material_topics (id, name, link, description, parent_id) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, name, link, description, parentId || null)
      .run();
    const topic = await authorization.database
      .prepare(`SELECT id, name, link, description, parent_id AS parentId, created_at AS createdAt FROM study_material_topics WHERE id = ?`)
      .bind(id)
      .first();
    return NextResponse.json({ success: true, topic }, { status: 201 });
  } catch (error) {
    console.error("Creating study material topic failed:", error);
    return NextResponse.json({ success: false, error: "Unable to add the topic." }, { status: 500 });
  }
}

export async function PATCH(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch {
    return NextResponse.json({ success: false, error: "Unable to verify admin access." }, { status: 500 });
  }
  if (authorization.response) return authorization.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const link = typeof body?.link === "string" ? body.link.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!id) return NextResponse.json({ success: false, error: "A topic ID is required." }, { status: 400 });
  if (!name || name.length > 120) {
    return NextResponse.json({ success: false, error: "Topic name is required and must be 120 characters or fewer." }, { status: 400 });
  }
  if (link.length > 2048) {
    return NextResponse.json({ success: false, error: "Link must be 2048 characters or fewer." }, { status: 400 });
  }
  if (link) {
    try {
      const parsed = new URL(link);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
    } catch {
      return NextResponse.json({ success: false, error: "Enter a valid HTTP or HTTPS link." }, { status: 400 });
    }
  }
  if (description.length > 500) {
    return NextResponse.json({ success: false, error: "Description must be 500 characters or fewer." }, { status: 400 });
  }

  try {
    const currentTopic = await authorization.database
      .prepare(`SELECT parent_id AS parentId FROM study_material_topics WHERE id = ?`)
      .bind(id)
      .first();
    if (!currentTopic) {
      return NextResponse.json({ success: false, error: "Topic not found." }, { status: 404 });
    }
    const duplicate = await authorization.database
      .prepare(
        `SELECT id FROM study_material_topics
         WHERE lower(trim(name)) = lower(trim(?))
           AND id <> ?
           AND ((parent_id IS NULL AND ? IS NULL) OR parent_id = ?)
         LIMIT 1`,
      )
      .bind(name, id, currentTopic.parentId, currentTopic.parentId)
      .first();
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "A topic with this name already exists here." },
        { status: 409 },
      );
    }
    if (currentTopic.parentId) {
      const parent = await authorization.database
        .prepare(`SELECT name FROM study_material_topics WHERE id = ?`)
        .bind(currentTopic.parentId)
        .first();
      if (parent && parent.name.trim().toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: "A topic cannot have the same name as its parent." },
          { status: 409 },
        );
      }
    }
    const duplicateChild = await authorization.database
      .prepare(
        `SELECT id FROM study_material_topics
         WHERE parent_id = ?
           AND lower(trim(name)) = lower(trim(?))
         LIMIT 1`,
      )
      .bind(id, name)
      .first();
    if (duplicateChild) {
      return NextResponse.json(
        { success: false, error: "A topic cannot have the same name as one of its subtopics." },
        { status: 409 },
      );
    }
    await authorization.database
      .prepare(`UPDATE study_material_topics SET name = ?, link = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
      .bind(name, link, description, id)
      .run();
    const topic = await authorization.database
      .prepare(`SELECT id, name, link, description, parent_id AS parentId, created_at AS createdAt FROM study_material_topics WHERE id = ?`)
      .bind(id)
      .first();
    if (!topic) return NextResponse.json({ success: false, error: "Topic not found." }, { status: 404 });
    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error("Updating study material topic failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update the topic." }, { status: 500 });
  }
}

export async function DELETE(request) {
  let authorization;
  try { authorization = await authorizeAdmin(request); } catch { return NextResponse.json({ success: false, error: "Unable to verify admin access." }, { status: 500 }); }
  if (authorization.response) return authorization.response;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 }); }
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ success: false, error: "A topic ID is required." }, { status: 400 });
  try {
    await authorization.database.prepare(`DELETE FROM study_material_topics WHERE id = ?`).bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deleting study material topic failed:", error);
    return NextResponse.json({ success: false, error: "Unable to delete the topic." }, { status: 500 });
  }
}
