import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { listAppliedJobs, updateAppliedJobInterviewStatus } from "@/lib/jobStore";

export const dynamic = "force-dynamic";

async function authorizeUser(request) {
  const database = await getDatabaseAsync();
  const user = await getCurrentUser(database, request);
  if (!user) {
    return {
      database,
      response: NextResponse.json(
        { success: false, error: "Sign in to track applied jobs." },
        { status: 401 },
      ),
    };
  }
  return { database, user, response: null };
}

export async function GET(request) {
  try {
    const { database, user, response } = await authorizeUser(request);
    if (response) {
      return response;
    }

    return NextResponse.json({
      success: true,
      jobs: await listAppliedJobs(database, user.id),
    });
  } catch (error) {
    console.error("Loading applied jobs failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load applied jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  let authorization;
  try {
    authorization = await authorizeUser(request);
  } catch (error) {
    console.error("Applied job authorization failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify your sign-in." },
      { status: 500 },
    );
  }
  if (authorization.response) {
    return authorization.response;
  }
  if (authorization.user.accountStatus === "on_hold") {
    return NextResponse.json(
      { success: false, error: "Your account is on hold and cannot apply to jobs right now." },
      { status: 403 },
    );
  }
  if (!authorization.user.isVerified) {
    return NextResponse.json(
      { success: false, error: "Complete your profile before applying to jobs." },
      { status: 403 },
    );
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

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  if (!jobId || jobId.length > 128) {
    return NextResponse.json(
      { success: false, error: "A valid job ID is required." },
      { status: 400 },
    );
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
        { success: false, error: "This job is no longer available to mark as applied." },
        { status: 404 },
      );
    }

    await authorization.database
      .prepare("INSERT OR IGNORE INTO applied_jobs (user_id, job_id) VALUES (?, ?)")
      .bind(authorization.user.id, jobId)
      .run();
    return NextResponse.json({ success: true, isApplied: true });
  } catch (error) {
    console.error("Marking job as applied failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to mark this job as applied." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  let authorization;
  try {
    authorization = await authorizeUser(request);
  } catch (error) {
    console.error("Applied job authorization failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify your sign-in." },
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

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  if (!jobId || jobId.length > 128 || typeof body.gotInterview !== "boolean") {
    return NextResponse.json(
      { success: false, error: "Choose an applied job and a valid interview status." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAppliedJobInterviewStatus(
      authorization.database,
      authorization.user.id,
      jobId,
      body.gotInterview,
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "This job is not in your applied companies." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, gotInterview: body.gotInterview });
  } catch (error) {
    console.error("Updating applied job interview status failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update interview status." },
      { status: 500 },
    );
  }
}
