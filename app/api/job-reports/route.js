import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { validateJobReport } from "@/lib/supportValidation";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const validation = validateJobReport(body);
  if (validation.error) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }
  const { jobId, reason, message } = validation.value;

  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to report a job." }, { status: 401 });
    }

    const job = await database
      .prepare(
        `SELECT id, title, company, location, application_url
         FROM jobs
        WHERE id = ? AND status = 'published'
         LIMIT 1`,
      )
      .bind(jobId)
      .first();
    if (!job) {
      return NextResponse.json({ success: false, error: "This job is no longer available to report." }, { status: 404 });
    }

    const reportId = crypto.randomUUID();
    await database
      .prepare(
        `INSERT INTO job_reports (
           id, user_id, user_handle, user_name, job_id, job_title, company_name,
           job_location, application_url, reason, message
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        reportId,
        user.id,
        user.handle,
        user.name,
        job.id,
        job.title,
        job.company,
        job.location,
        job.application_url,
        reason,
        message,
      )
      .run();

    return NextResponse.json({ success: true, reportId });
  } catch (error) {
    console.error("Submitting job report failed:", error);
    return NextResponse.json({ success: false, error: "Unable to submit the job report." }, { status: 500 });
  }
}
