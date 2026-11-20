import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const { configured, user } = await getCurrentAdmin(database, request);

    if (!configured) {
      return NextResponse.json(
        { success: false, error: "Admin login is not configured." },
        { status: 503 },
      );
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Admin sign-in is required." },
        { status: 401 },
      );
    }

    const [userResult, jobResult, companyResult, interviewResult, placedResult] = await Promise.all([
      database
        .prepare("SELECT COUNT(*) AS total FROM users")
        .first(),
      database
        .prepare(
          "SELECT COUNT(*) AS total FROM jobs WHERE status = 'published' AND expired_at IS NULL",
        )
        .first(),
      database
        .prepare("SELECT COUNT(*) AS total FROM companies")
        .first(),
      database
        .prepare("SELECT COUNT(DISTINCT user_id) AS total FROM applied_jobs WHERE got_interview = 1")
        .first(),
      database
        .prepare("SELECT COUNT(*) AS total FROM users WHERE is_placed = 1")
        .first(),
    ]);
    const totalUsers = Number(userResult?.total);
    const totalJobs = Number(jobResult?.total);
    const totalCompanies = Number(companyResult?.total);
    const totalInterviewCalls = Number(interviewResult?.total);
    const totalPlacedUsers = Number(placedResult?.total);
    if (
      !Number.isSafeInteger(totalUsers)
      || totalUsers < 0
      || !Number.isSafeInteger(totalJobs)
      || totalJobs < 0
      || !Number.isSafeInteger(totalCompanies)
      || totalCompanies < 0
      || !Number.isSafeInteger(totalInterviewCalls)
      || totalInterviewCalls < 0
      || !Number.isSafeInteger(totalPlacedUsers)
      || totalPlacedUsers < 0
    ) {
      throw new Error("The dashboard count query returned an invalid total.");
    }

    return NextResponse.json({
      success: true,
      metrics: {
        jobs: totalJobs,
        companies: totalCompanies,
        users: totalUsers,
        interviewCalls: totalInterviewCalls,
        placedUsers: totalPlacedUsers,
      },
    });
  } catch (error) {
    console.error("Admin dashboard metrics failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load dashboard metrics." },
      { status: 500 },
    );
  }
}
