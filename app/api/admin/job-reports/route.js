import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const { configured, user } = await getCurrentAdmin(database, request);
    if (!configured) {
      return NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 });
    }

    const result = await database
      .prepare(
        `SELECT id, user_handle, user_name, job_id, job_title, company_name,
                job_location, application_url, reason, message, status, created_at
         FROM job_reports
         ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC
         LIMIT 500`,
      )
      .all();

    return NextResponse.json({
      success: true,
      reports: (result.results || []).map((report) => ({
        id: report.id,
        userHandle: report.user_handle,
        userName: report.user_name,
        jobId: report.job_id,
        jobTitle: report.job_title,
        companyName: report.company_name,
        jobLocation: report.job_location,
        applicationUrl: report.application_url,
        reason: report.reason,
        message: report.message,
        status: report.status,
        createdAt: report.created_at,
      })),
    });
  } catch (error) {
    console.error("Loading job reports failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load job reports." }, { status: 500 });
  }
}
