import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";
import { createCompany, listCompanies } from "@/lib/companyStore";

export const dynamic = "force-dynamic";

async function authorizeAdmin(request) {
  const database = await getDatabaseAsync();
  const { configured, user } = await getCurrentAdmin(database, request);
  if (!configured) {
    return {
      database,
      response: NextResponse.json(
        { success: false, error: "Admin login is not configured." },
        { status: 503 },
      ),
    };
  }
  if (!user) {
    return {
      database,
      response: NextResponse.json(
        { success: false, error: "Admin sign-in is required." },
        { status: 401 },
      ),
    };
  }
  return { database, response: null };
}

export async function GET(request) {
  try {
    const { database, response } = await authorizeAdmin(request);
    if (response) {
      return response;
    }

    return NextResponse.json({
      success: true,
      companies: await listCompanies(database),
    });
  } catch (error) {
    console.error("Loading admin companies failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load companies." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    console.error("Admin company authorization failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify admin access." },
      { status: 500 },
    );
  }
  if (authorization.response) {
    return authorization.response;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "A valid JSON body is required." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, error: "A valid JSON body is required." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 160) {
    return NextResponse.json(
      { success: false, error: "Company name is required and must be 160 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const result = await createCompany(authorization.database, name);
    return NextResponse.json(
      { success: true, company: result.company, created: result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Creating admin company failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save the company." },
      { status: 500 },
    );
  }
}
