import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { listSavedJobs } from "@/lib/jobStore";

export const dynamic = "force-dynamic";

async function authorizeUser(request) {
  const database = await getDatabaseAsync();
  const user = await getCurrentUser(database, request);
  if (!user) {
    return {
      database,
      response: NextResponse.json(
        { success: false, error: "Sign in to save jobs." },
        { status: 401 },
      ),
    };
  }
  return { database, user, response: null };
}

async function readJobId(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { error: "A valid JSON body is required." };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid JSON body is required." };
  }
  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  if (!jobId || jobId.length > 128) {
    return { error: "A valid job ID is required." };
  }
  return { jobId };
}

export async function GET(request) {
  try {
    const { database, user, response } = await authorizeUser(request);
    if (response) {
      return response;
    }

    const jobs = await listSavedJobs(database, user.id);
    const isOnHold = user.accountStatus === "on_hold";
    for (const job of jobs) {
      job.isOnHold = isOnHold;
      job.canApply = user.isVerified && !isOnHold;
    }

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Loading saved jobs failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load saved jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let authorization;
  try {
    authorization = await authorizeUser(request);
  } catch (error) {
    console.error("Saved job authorization failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify your sign-in." },
      { status: 500 },
    );
  }
  if (authorization.response) {
    return authorization.response;
  }

  const { jobId, error } = await readJobId(request);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  try {
    const job = await authorization.database
      .prepare(
        `SELECT id FROM jobs
         WHERE id = ? AND status = 'published' AND expired_at IS NULL
         LIMIT 1`,
      )
      .bind(jobId)
      .first();
    if (!job) {
      return NextResponse.json(
        { success: false, error: "This job is no longer available to save." },
        { status: 404 },
      );
    }

    await authorization.database
      .prepare("INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)")
      .bind(authorization.user.id, jobId)
      .run();
    return NextResponse.json({ success: true, isSaved: true });
  } catch (error) {
    console.error("Saving job failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save this job." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  let authorization;
  try {
    authorization = await authorizeUser(request);
  } catch (error) {
    console.error("Saved job authorization failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify your sign-in." },
      { status: 500 },
    );
  }
  if (authorization.response) {
    return authorization.response;
  }

  const { jobId, error } = await readJobId(request);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  try {
    await authorization.database
      .prepare("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?")
      .bind(authorization.user.id, jobId)
      .run();
    return NextResponse.json({ success: true, isSaved: false });
  } catch (error) {
    console.error("Removing saved job failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to remove the saved job." },
      { status: 500 },
    );
  }
}
