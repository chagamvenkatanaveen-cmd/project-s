import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }
  if (!body || body.status !== "reviewed") {
    return NextResponse.json({ success: false, error: "A valid report status is required." }, { status: 400 });
  }

  try {
    const database = await getDatabaseAsync();
    const { configured, user } = await getCurrentAdmin(database, request);
    if (!configured) {
      return NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 });
    }

    const { id } = await params;
    const result = await database
      .prepare(
        `UPDATE job_reports
         SET status = 'reviewed', reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
             reviewed_by = ?
         WHERE id = ? AND status = 'open'`,
      )
      .bind(user.email, id)
      .run();
    if (!result.meta?.changes) {
      const report = await database
        .prepare("SELECT id FROM job_reports WHERE id = ? LIMIT 1")
        .bind(id)
        .first();
      return NextResponse.json(
        { success: false, error: report ? "This report has already been reviewed." : "Job report not found." },
        { status: report ? 409 : 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Updating job report failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update the job report." }, { status: 500 });
  }
}
