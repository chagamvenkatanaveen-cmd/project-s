import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { listCompanyOpportunityCounts, listPublishedJobs } from "@/lib/jobStore";

export const dynamic = "force-dynamic";

const JOB_TYPES = ["Intern", "Full-time", "Intern to Full-time"];
const EXPERIENCE_REQUIREMENTS = ["freshers", "experienced", "student"];

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sign in to view jobs." },
        { status: 401 },
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("q") || "";
    const employmentType = searchParams.get("type") || "";
    const experienceRequired = searchParams.get("experience") || "";
    const highPriorityParam = searchParams.get("highPriority");
    const companyName = searchParams.get("company") || "";
    if (query.length > 120) {
      return NextResponse.json(
        { success: false, error: "Search terms must be 120 characters or fewer." },
        { status: 400 },
      );
    }
    if (employmentType && !JOB_TYPES.includes(employmentType)) {
      return NextResponse.json(
        { success: false, error: "Choose a valid job type." },
        { status: 400 },
      );
    }
    if (experienceRequired && !EXPERIENCE_REQUIREMENTS.includes(experienceRequired)) {
      return NextResponse.json(
        { success: false, error: "Choose a valid experience requirement." },
        { status: 400 },
      );
    }
    if (highPriorityParam !== null && !["true", "false"].includes(highPriorityParam)) {
      return NextResponse.json(
        { success: false, error: "Choose a valid priority filter." },
        { status: 400 },
      );
    }
    if (companyName.length > 160) {
      return NextResponse.json(
        { success: false, error: "Company names must be 160 characters or fewer." },
        { status: 400 },
      );
    }

    const includeCompanyOpportunities = searchParams.get("includeCompanyOpportunities") === "true";
    const summaryOnly = searchParams.get("summaryOnly") === "true";
    if (summaryOnly && !includeCompanyOpportunities) {
      return NextResponse.json(
        { success: false, error: "Company summaries must be requested explicitly." },
        { status: 400 },
      );
    }
    const response = { success: true };
    if (!summaryOnly) {
      const jobs = await listPublishedJobs(
        database,
        query,
        user.id,
        employmentType || null,
        experienceRequired || null,
        companyName || null,
        highPriorityParam === "true",
      );
      const isOnHold = user.accountStatus === "on_hold";
      for (const job of jobs) {
        job.isOnHold = isOnHold;
        job.canApply = user.isVerified && !isOnHold;
      }
      response.jobs = jobs;
    }
    if (includeCompanyOpportunities) {
      response.companyOpportunities = await listCompanyOpportunityCounts(database);
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error("Loading jobs failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load jobs." },
      { status: 500 },
    );
  }
}
