const EMPLOYMENT_TYPES = ["Intern", "Full-time", "Intern to Full-time"];
const WORK_MODES = ["On-site", "Hybrid", "Remote"];

export function validateJobInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A valid JSON body is required." };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const rawBatch = body.batch;
  const batch = typeof rawBatch === "string"
    ? rawBatch.trim()
    : typeof rawBatch === "number" && Number.isFinite(rawBatch)
      ? String(rawBatch)
      : "";
  const roleType = typeof body.roleType === "string" ? body.roleType.trim() : "";
  const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const employmentType = typeof body.employmentType === "string" ? body.employmentType : "";
  const workMode = typeof body.workMode === "string" ? body.workMode : "";
  const candidateEligibility = typeof body.candidateEligibility === "string"
    ? body.candidateEligibility
    : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const salaryRange = typeof body.salaryRange === "string" ? body.salaryRange.trim() : "";
  const applicationUrl = typeof body.applicationUrl === "string" ? body.applicationUrl.trim() : "";
  const highPriority = body.highPriority === true;
  const rawYearsExperience = body.yearsExperience;
  const requestedYearsExperience = typeof rawYearsExperience === "number"
    ? rawYearsExperience
    : typeof rawYearsExperience === "string" && rawYearsExperience.trim()
      ? Number(rawYearsExperience)
      : Number.NaN;
  const yearsExperience = candidateEligibility === "experienced" ? requestedYearsExperience : 0;

  if (!title || title.length > 160 || !companyId || !location || location.length > 160) {
    return { error: "Title, a listed company, and location are required." };
  }
  if (!batch || batch.length > 120) {
    return { error: "Batch is required and must be 120 characters or fewer." };
  }
  if (roleType.length > 160) {
    return { error: "Role type must be 160 characters or fewer." };
  }
  if (!EMPLOYMENT_TYPES.includes(employmentType) || !WORK_MODES.includes(workMode)) {
    return { error: "Choose a valid employment type and work mode." };
  }
  if (!["freshers", "experienced", "student"].includes(candidateEligibility)) {
    return { error: "Choose who can apply to this job." };
  }
  if (body.highPriority !== undefined && typeof body.highPriority !== "boolean") {
    return { error: "Choose whether this job is high priority." };
  }
  if (!description || description.length > 10000) {
    return { error: "Description must be between 1 and 10,000 characters." };
  }
  if (
    !Number.isInteger(yearsExperience)
    || yearsExperience < (candidateEligibility === "experienced" ? 1 : 0)
    || yearsExperience > 60
  ) {
    return {
      error: candidateEligibility === "experienced"
        ? "Minimum experience must be a whole number from 1 to 60 years."
        : "Years of experience must be a whole number from 0 to 60.",
    };
  }
  if (!applicationUrl) {
    return { error: "An application URL is required." };
  }
  if (salaryRange.length > 120 || applicationUrl.length > 2048) {
    return { error: "Salary range or application link is too long." };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(applicationUrl);
  } catch {
    return { error: "Enter a valid application URL." };
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: "Application links must use HTTP or HTTPS." };
  }

  return {
    values: {
      title,
      batch,
      roleType,
      companyId,
      location,
      employmentType,
      workMode,
      candidateEligibility,
      description,
      salaryRange,
      applicationUrl,
      yearsExperience,
      highPriority,
    },
  };
}
