import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";
import {
  DEFAULT_AVATAR_CONFIG,
  validateAvatarConfig,
} from "@/lib/avatarConfig";
import { isProfileVerified } from "@/lib/profileVerification";
import { validateProfileUrl } from "@/lib/socialProfileValidation";

export const dynamic = "force-dynamic";

function getStoredAvatarConfig(value) {
  if (value === null || value === undefined || value === "") {
    return { ...DEFAULT_AVATAR_CONFIG };
  }

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("The stored avatar configuration is invalid JSON.");
  }

  const validation = validateAvatarConfig(parsed);
  if (validation.error) {
    throw new Error(validation.error);
  }
  return validation.value;
}

function validateProfile(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid profile is required." };
  }

  const yearsExperience = body.yearsExperience;
  const isStudent = body.isStudent;
  const degree = typeof body.degree === "string" ? body.degree.trim() : "";
  const branch = typeof body.branch === "string" ? body.branch.trim() : "";
  const passingYear = body.passingYear;
  const preferredRoles = typeof body.preferredRoles === "string" ? body.preferredRoles.trim() : "";
  const avatarKeyValue = typeof body.avatarKey === "string" ? body.avatarKey.trim() : "";
  const avatarKey = avatarKeyValue || "male";
  const avatarConfig = validateAvatarConfig(body.avatarConfig);
  const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const instagramUrl = validateProfileUrl(body.instagramUrl ?? "", "instagram");
  const linkedinUrl = validateProfileUrl(body.linkedinUrl ?? "", "linkedin");
  const leetcodeUrl = validateProfileUrl(body.leetcodeUrl ?? "", "leetcode");
  const portfolioUrl = validateProfileUrl(body.portfolioUrl ?? "", "portfolio");
  const isPlaced = body.isPlaced;
  const phoneDigits = phoneNumber.replace(/\D/g, "").length;

  if (instagramUrl.error) {
    return { error: instagramUrl.error };
  }
  if (linkedinUrl.error) {
    return { error: linkedinUrl.error };
  }
  if (leetcodeUrl.error) {
    return { error: leetcodeUrl.error };
  }
  if (portfolioUrl.error) {
    return { error: portfolioUrl.error };
  }
  if (avatarConfig.error) {
    return { error: avatarConfig.error };
  }
  if (!Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) {
    return { error: "Years of experience must be a whole number from 0 to 60." };
  }
  if (typeof isStudent !== "boolean") {
    return { error: "Choose whether you are currently a student." };
  }
  if (isPlaced !== undefined && typeof isPlaced !== "boolean") {
    return { error: "Choose whether you are currently placed." };
  }
  if (!degree || degree.length > 120) {
    return { error: "Degree must be between 1 and 120 characters." };
  }
  if (!branch || branch.length > 120) {
    return { error: "Branch must be between 1 and 120 characters." };
  }
  if (!Number.isInteger(passingYear) || passingYear < 1950 || passingYear > 2100) {
    return { error: "Year of passing must be between 1950 and 2100." };
  }
  if (preferredRoles.length > 300) {
    return { error: "Preferred roles must be 300 characters or fewer." };
  }
  if (avatarKey !== "male" && avatarKey !== "female") {
    return { error: "Choose a valid avatar." };
  }
  if (
    phoneNumber.length > 32 ||
    (phoneNumber &&
      (!/^\+?[0-9\s().-]+$/.test(phoneNumber) || phoneDigits < 7 || phoneDigits > 15))
  ) {
    return { error: "Enter a valid phone number, or leave it blank." };
  }

  return {
    value: {
      yearsExperience,
      isStudent,
      degree,
      branch,
      passingYear,
      preferredRoles,
      avatarKey,
      avatarConfig: avatarConfig.value,
      phoneNumber,
      instagramUrl: instagramUrl.value,
      linkedinUrl: linkedinUrl.value,
      leetcodeUrl: leetcodeUrl.value,
      portfolioUrl: portfolioUrl.value,
      isPlaced,
    },
  };
}

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to update your profile." }, { status: 401 });
    }

    const profile = await database
      .prepare(
        `SELECT years_experience, is_student, degree, branch, passing_year, preferred_roles,
                avatar_key, avatar_config, phone_number, is_placed, instagram_url, linkedin_url,
                leetcode_url, portfolio_url
         FROM users WHERE id = ? LIMIT 1`,
      )
      .bind(user.id)
      .first();

    return NextResponse.json({
      success: true,
      email: user.email,
      profile: {
        yearsExperience: profile?.years_experience ?? "",
        isStudent: profile?.is_student === 1,
        isStudentSpecified: profile?.is_student === 0 || profile?.is_student === 1,
        degree: profile?.degree ?? "",
        branch: profile?.branch ?? "",
        passingYear: profile?.passing_year ?? "",
        preferredRoles: profile?.preferred_roles ?? "",
        avatarKey: profile?.avatar_key === "female" ? "female" : "male",
        avatarConfig: getStoredAvatarConfig(profile?.avatar_config),
        phoneNumber: profile?.phone_number ?? "",
        instagramUrl: profile?.instagram_url ?? "",
        linkedinUrl: profile?.linkedin_url ?? "",
        leetcodeUrl: profile?.leetcode_url ?? "",
        portfolioUrl: profile?.portfolio_url ?? "",
        isPlaced: profile?.is_placed === 1,
      },
      isVerified: isProfileVerified(profile),
    });
  } catch (error) {
    console.error("Profile lookup failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load your profile details." }, { status: 500 });
  }
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const validation = validateProfile(body);
  if (validation.error) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  try {
    const database = await getDatabaseAsync();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to update your profile." }, { status: 401 });
    }

    const {
      yearsExperience,
      isStudent,
      degree,
      branch,
      passingYear,
      preferredRoles,
      avatarKey,
      avatarConfig,
      phoneNumber,
      instagramUrl,
      linkedinUrl,
      leetcodeUrl,
      portfolioUrl,
      isPlaced,
    } = validation.value;
    await database
      .prepare(
        `UPDATE users
         SET years_experience = ?, is_student = ?, degree = ?, branch = ?,
             passing_year = ?, preferred_roles = ?, avatar_key = ?, avatar_config = ?,
             phone_number = ?,
             instagram_url = ?, linkedin_url = ?, leetcode_url = ?, portfolio_url = ?,
             is_placed = COALESCE(?, is_placed),
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      )
      .bind(
        yearsExperience,
        isStudent ? 1 : 0,
        degree,
        branch,
        passingYear,
        preferredRoles || null,
        avatarKey,
        JSON.stringify(avatarConfig),
        phoneNumber || null,
        instagramUrl || null,
        linkedinUrl || null,
        leetcodeUrl || null,
        portfolioUrl || null,
        isPlaced === undefined ? null : isPlaced ? 1 : 0,
        user.id,
      )
      .run();

    const updatedProfile = await database
      .prepare("SELECT is_placed FROM users WHERE id = ? LIMIT 1")
      .bind(user.id)
      .first();
    return NextResponse.json({
      success: true,
      profile: { ...validation.value, isPlaced: updatedProfile?.is_placed === 1 },
      isVerified: true,
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ success: false, error: "Unable to save your profile details." }, { status: 500 });
  }
}
