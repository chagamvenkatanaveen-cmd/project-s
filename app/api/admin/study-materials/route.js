import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";
import {
  createStudyMaterial,
  deleteStudyMaterial,
  listStudyMaterials,
  updateStudyMaterial,
} from "@/lib/studyMaterialStore";

export const dynamic = "force-dynamic";

async function authorizeAdmin(request) {
  const database = await getDatabaseAsync();
  const { configured, user } = await getCurrentAdmin(database, request);
  if (!configured) {
    return { database, response: NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 }) };
  }
  if (!user) {
    return { database, response: NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 }) };
  }
  return { database, response: null };
}

function validateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid study material is required." };
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";
  if (!title || title.length > 160) {
    return { error: "Title is required and must be 160 characters or fewer." };
  }
  if (description.length > 500) {
    return { error: "Description must be 500 characters or fewer." };
  }
  if (!url || url.length > 2048) {
    return { error: "A valid link is required." };
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return { error: "Enter a valid HTTP or HTTPS link." };
  }
  return { values: { title, description, url, topicId: topicId || null } };
}

export async function GET(request) {
  try {
    const { database, response } = await authorizeAdmin(request);
    if (response) return response;
    return NextResponse.json({ success: true, studyMaterials: await listStudyMaterials(database) });
  } catch (error) {
    console.error("Loading admin study materials failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load study materials." }, { status: 500 });
  }
}

export async function POST(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unable to verify admin access." }, { status: 500 });
  }
  if (authorization.response) return authorization.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }
  const validation = validateInput(body);
  if (validation.error) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });

  try {
    const studyMaterial = await createStudyMaterial(authorization.database, validation.values);
    return NextResponse.json({ success: true, studyMaterial }, { status: 201 });
  } catch (error) {
    console.error("Creating study material failed:", error);
    return NextResponse.json({ success: false, error: "Unable to add the study material." }, { status: 500 });
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
  if (!id) return NextResponse.json({ success: false, error: "A study material ID is required." }, { status: 400 });
  const validation = validateInput(body);
  if (validation.error) return NextResponse.json({ success: false, error: validation.error }, { status: 400 });

  try {
    const studyMaterial = await updateStudyMaterial(authorization.database, id, validation.values);
    if (!studyMaterial) return NextResponse.json({ success: false, error: "Study material not found." }, { status: 404 });
    return NextResponse.json({ success: true, studyMaterial });
  } catch (error) {
    console.error("Updating study material failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update the study material." }, { status: 500 });
  }
}

export async function DELETE(request) {
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
  if (!id) return NextResponse.json({ success: false, error: "A study material ID is required." }, { status: 400 });

  try {
    await deleteStudyMaterial(authorization.database, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deleting study material failed:", error);
    return NextResponse.json({ success: false, error: "Unable to delete the study material." }, { status: 500 });
  }
}
