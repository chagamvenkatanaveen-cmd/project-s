import { NextResponse } from "next/server";
import { getConfiguredAdminEmail, getCurrentAdmin } from "@/lib/adminAuth";
import { hashPassword, PASSWORD_ITERATIONS } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import { isValidPassword } from "@/lib/passwordValidation";
import { isValidUsername } from "@/lib/usernameValidation";

export const dynamic = "force-dynamic";

async function authorizeAdmin(request) {
  const database = await getDatabaseAsync();
  const { configured, user } = await getCurrentAdmin(database, request);
  if (!configured) {
    return {
      database,
      response: NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 }),
    };
  }
  if (!user) {
    return {
      database,
      response: NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 }),
    };
  }
  return { database, response: null };
}

export async function GET(request, { params }) {
  try {
    const authorization = await authorizeAdmin(request);
    if (authorization.response) {
      return authorization.response;
    }

    const { id } = await params;
    const user = await authorization.database
      .prepare(
        `SELECT id, email, handle, display_name, password_hash, avatar_key, phone_number,
                years_experience, is_student, degree, branch, passing_year, preferred_roles,
                instagram_url, linkedin_url, leetcode_url, portfolio_url,
                is_placed, account_status, approval_status, created_at
         FROM users WHERE id = ? LIMIT 1`,
      )
      .bind(id)
      .first();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const isAnonymized = user.account_status === "deactivated" && !user.password_hash;
    const appliedJobs = await authorization.database
      .prepare(
        `SELECT jobs.id, jobs.title, COALESCE(companies.name, jobs.company) AS company,
                applied_jobs.applied_at, applied_jobs.got_interview
         FROM applied_jobs
         JOIN jobs ON jobs.id = applied_jobs.job_id
         LEFT JOIN companies ON companies.id = jobs.company_id
         WHERE applied_jobs.user_id = ?
         ORDER BY applied_jobs.applied_at DESC
         LIMIT 100`,
      )
      .bind(id)
      .all();
    if (!Array.isArray(appliedJobs.results)) {
      throw new Error("The applied jobs query returned an invalid result set.");
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: isAnonymized ? "Deleted user" : user.display_name,
        email: isAnonymized ? null : user.email,
        handle: isAnonymized ? null : user.handle,
        avatarKey: user.avatar_key,
        phoneNumber: user.phone_number,
        yearsExperience: user.years_experience,
        isStudent: user.is_student === null ? null : user.is_student === 1,
        degree: user.degree,
        branch: user.branch,
        passingYear: user.passing_year,
        preferredRoles: user.preferred_roles,
        instagramUrl: user.instagram_url,
        linkedinUrl: user.linkedin_url,
        leetcodeUrl: user.leetcode_url,
        portfolioUrl: user.portfolio_url,
        isPlaced: user.is_placed === 1,
        accountStatus: user.account_status,
        approvalStatus: user.approval_status,
        createdAt: user.created_at,
        appliedJobs: appliedJobs.results.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          appliedAt: job.applied_at,
          gotInterview: job.got_interview === 1,
        })),
      },
    });
  } catch (error) {
    console.error("Loading admin user details failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load user details." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    console.error("Admin user authorization failed:", error);
    return NextResponse.json({ success: false, error: "Unable to verify admin access." }, { status: 500 });
  }

  if (authorization.response) {
    return authorization.response;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }
  if (!body || (body.approvalStatus === undefined && !["active", "on_hold", "deactivated"].includes(body.accountStatus))) {
    return NextResponse.json({ success: false, error: "Choose a valid user account status." }, { status: 400 });
  }

  try {
    const { id } = await params;
    const user = await authorization.database
      .prepare("SELECT email, account_status, password_hash FROM users WHERE id = ? LIMIT 1")
      .bind(id)
      .first();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }
    if (body.approvalStatus !== undefined) {
      if (!["pending", "approved"].includes(body.approvalStatus)) {
        return NextResponse.json({ success: false, error: "Choose a valid approval status." }, { status: 400 });
      }
      await authorization.database
        .prepare(
          `UPDATE users
           SET approval_status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?`,
        )
        .bind(body.approvalStatus, id)
        .run();
      if (body.approvalStatus === "pending") {
        await authorization.database
          .prepare("DELETE FROM user_sessions WHERE user_id = ?")
          .bind(id)
          .run();
      }
      return NextResponse.json({ success: true, approvalStatus: body.approvalStatus });
    }
    if (user.account_status === "deactivated" && body.accountStatus !== "active") {
      return NextResponse.json({ success: false, error: "A deactivated account can only be activated." }, { status: 409 });
    }

    if (body.accountStatus === "deactivated") {
      if (body.account !== undefined) {
        return NextResponse.json({ success: false, error: "Account details cannot be changed while deactivating a user." }, { status: 400 });
      }

      const adminEmail = await getConfiguredAdminEmail();
      if (user.email.toLowerCase() === adminEmail) {
        return NextResponse.json({ success: false, error: "The configured admin account cannot be deactivated." }, { status: 409 });
      }

      await authorization.database.batch([
        authorization.database
          .prepare(
            `UPDATE users
             SET account_status = 'deactivated',
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE id = ?`,
          )
          .bind(id),
        authorization.database
          .prepare("DELETE FROM user_sessions WHERE user_id = ?")
          .bind(id),
      ]);
      return NextResponse.json({ success: true, accountStatus: "deactivated" });
    }

    if (user.account_status === "deactivated" && !user.password_hash) {
      const account = body.account;
      const name = typeof account?.name === "string" ? account.name.trim() : "";
      const email = typeof account?.email === "string" ? account.email.trim().toLowerCase() : "";
      const handle = typeof account?.handle === "string" ? account.handle.trim().toLowerCase() : "";
      const password = typeof account?.password === "string" ? account.password : "";

      if (!name || name.length > 80) {
        return NextResponse.json({ success: false, error: "Name must be between 1 and 80 characters." }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
      }
      if (!isValidUsername(handle)) {
        return NextResponse.json(
          { success: false, error: "Username must be 8–24 characters: letters, numbers, or underscores." },
          { status: 400 },
        );
      }
      if (!isValidPassword(password)) {
        return NextResponse.json({ success: false, error: "Password must be 9–128 characters." }, { status: 400 });
      }
      if (email === await getConfiguredAdminEmail()) {
        return NextResponse.json({ success: false, error: "The configured admin email cannot be used for a user account." }, { status: 409 });
      }

      const existing = await authorization.database
        .prepare("SELECT id FROM users WHERE (email = ? OR handle = ?) AND id != ? LIMIT 1")
        .bind(email, handle, id)
        .first();
      if (existing) {
        return NextResponse.json(
          { success: false, error: "That email or username is already registered." },
          { status: 409 },
        );
      }

      const { hash, salt } = await hashPassword(password);
      await authorization.database
        .prepare(
          `UPDATE users
           SET email = ?, handle = ?, display_name = ?, password_hash = ?, password_salt = ?,
               password_iterations = ?, account_status = 'active',
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ? AND account_status = 'deactivated'`,
        )
        .bind(email, handle, name, hash, salt, PASSWORD_ITERATIONS, id)
        .run();
    } else {
      if (body.account !== undefined) {
        return NextResponse.json({ success: false, error: "Account details can only be provided when restoring an anonymized account." }, { status: 400 });
      }
      await authorization.database
        .prepare(
          `UPDATE users
           SET account_status = ?,
               approval_status = CASE WHEN ? = 'active' THEN 'approved' ELSE approval_status END,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?`,
        )
        .bind(body.accountStatus, body.accountStatus, id)
        .run();
    }

    return NextResponse.json({ success: true, accountStatus: body.accountStatus });
  } catch (error) {
    console.error("Updating admin user status failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update the user status." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  let authorization;
  try {
    authorization = await authorizeAdmin(request);
  } catch (error) {
    console.error("Admin user authorization failed:", error);
    return NextResponse.json({ success: false, error: "Unable to verify admin access." }, { status: 500 });
  }
  if (authorization.response) {
    return authorization.response;
  }

  try {
    const { id } = await params;
    const user = await authorization.database
      .prepare("SELECT email FROM users WHERE id = ? LIMIT 1")
      .bind(id)
      .first();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const adminEmail = await getConfiguredAdminEmail();
    if (user.email.toLowerCase() === adminEmail) {
      return NextResponse.json({ success: false, error: "The configured admin account cannot be deleted." }, { status: 409 });
    }

    await authorization.database.batch([
      authorization.database
        .prepare("DELETE FROM users WHERE id = ?")
        .bind(id),
      authorization.database
        .prepare(
          `DELETE FROM conversations
           WHERE NOT EXISTS (
             SELECT 1 FROM conversation_members
             WHERE conversation_members.conversation_id = conversations.id
           )`,
        ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deleting admin user failed:", error);
    return NextResponse.json({ success: false, error: "Unable to permanently delete the user." }, { status: 500 });
  }
}
