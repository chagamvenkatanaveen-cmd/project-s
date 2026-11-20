import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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

    const searchParams = new URL(request.url).searchParams;
    const query = (searchParams.get("q") || "").trim();
    const filter = searchParams.get("filter") || "";
    const requestedPage = searchParams.get("page") || "1";
    if (query.length > 120) {
      return NextResponse.json(
        { success: false, error: "Search terms must be 120 characters or fewer." },
        { status: 400 },
      );
    }
    if (!["", "interview", "placed"].includes(filter)) {
      return NextResponse.json(
        { success: false, error: "Choose a valid user filter." },
        { status: 400 },
      );
    }
    if (!/^[1-9]\d*$/.test(requestedPage) || !Number.isSafeInteger(Number(requestedPage))) {
      return NextResponse.json(
        { success: false, error: "Page must be a positive whole number." },
        { status: 400 },
      );
    }

    const filters = [];
    const values = [];
    if (query) {
      filters.push(`(
        instr(lower(display_name), lower(?)) > 0
        OR instr(lower(handle), lower(?)) > 0
        OR instr(lower(email), lower(?)) > 0
      )`);
      values.push(query, query, query);
    }
    if (filter === "interview") {
      filters.push(
        `EXISTS (
          SELECT 1 FROM applied_jobs
          WHERE applied_jobs.user_id = users.id AND applied_jobs.got_interview = 1
        )`,
      );
    } else if (filter === "placed") {
      filters.push("is_placed = 1");
    }
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const countStatement = database.prepare(`SELECT COUNT(*) AS total FROM users ${whereClause}`);
    const countQuery = values.length ? countStatement.bind(...values) : countStatement;
    const count = await countQuery.first();
    const total = Number(count?.total);
    if (!Number.isSafeInteger(total) || total < 0) {
      throw new Error("The admin user count query returned an invalid total.");
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Number(requestedPage), totalPages);
    const offset = (page - 1) * PAGE_SIZE;
    const result = await database
      .prepare(
        `SELECT
          id,
          CASE
            WHEN account_status = 'deactivated' AND password_hash = '' THEN 'Deleted user'
            ELSE display_name
          END AS name,
          CASE
            WHEN account_status = 'deactivated' AND password_hash = '' THEN NULL
            ELSE handle
          END AS handle,
          CASE
            WHEN account_status = 'deactivated' AND password_hash = '' THEN NULL
            ELSE email
          END AS email,
          account_status AS accountStatus,
          approval_status AS approvalStatus,
          account_status = 'deactivated' AND password_hash = '' AS needsReactivationSetup
         FROM users
         ${whereClause}
         ORDER BY created_at DESC, id ASC
         LIMIT ? OFFSET ?`,
      )
      .bind(...values, PAGE_SIZE, offset)
      .all();
    if (!Array.isArray(result.results)) {
      throw new Error("The admin users query returned an invalid result set.");
    }

    return NextResponse.json({
      success: true,
      users: result.results,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
      filter,
    });
  } catch (error) {
    console.error("Loading admin users failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load users." },
      { status: 500 },
    );
  }
}
