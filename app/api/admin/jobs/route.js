import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getCompanyById } from "@/lib/companyStore";
import { getDatabaseAsync } from "@/lib/db";
import { createJob, listAdminJobs, unpublishJob, updateJob } from "@/lib/jobStore";
import { validateJobInput } from "@/lib/jobValidation";

export const dynamic = "force-dynamic";

const ADMIN_JOB_CATEGORIES = {
  jobs: ["Full-time"],
  internships: ["Intern", "Intern to Full-time"],
};

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

    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get("category");
    if (category && !ADMIN_JOB_CATEGORIES[category]) {
      return NextResponse.json(
        { success: false, error: "Choose a valid job category." },
        { status: 400 },
      );
    }
    const requestedCompanyName = searchParams.get("company");
    const companyName = requestedCompanyName?.trim() || null;
    if (
      requestedCompanyName !== null
      && (!companyName || companyName.length > 160)
    ) {
      return NextResponse.json(
        { success: false, error: "Choose a valid company." },
        { status: 400 },
      );
    }

    const jobs = await listAdminJobs(
      database,
      category ? ADMIN_JOB_CATEGORIES[category] : null,
      companyName,
    );
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Loading admin jobs failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    console.error("Admin job authorization failed:", error);
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
  const { values, error } = validateJobInput(body);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  try {
    const company = await getCompanyById(authorization.database, values.companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Select a listed company or add it first." },
        { status: 400 },
      );
    }

    const job = await createJob(authorization.database, {
      ...values,
      companyId: company.id,
      company: company.name,
    });
    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("Publishing admin job failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to publish the job." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    console.error("Admin job authorization failed:", error);
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
  const id = body && typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json(
      { success: false, error: "A job ID is required." },
      { status: 400 },
    );
  }

  const { values, error } = validateJobInput(body);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  try {
    const company = await getCompanyById(authorization.database, values.companyId);
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Select a listed company or add it first." },
        { status: 400 },
      );
    }

    const job = await updateJob(authorization.database, id, {
      ...values,
      companyId: company.id,
      company: company.name,
    });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Updating admin job failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update the job." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    console.error("Admin job authorization failed:", error);
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
  const id = body && typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json(
      { success: false, error: "A job ID is required." },
      { status: 400 },
    );
  }

  try {
    const unpublished = await unpublishJob(authorization.database, id);
    if (!unpublished) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deleting admin job failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete the job." },
      { status: 500 },
    );
  }
}
