const JOB_FIELDS = `jobs.id,
  jobs.title,
  jobs.role_type AS roleType,
  COALESCE(companies.name, jobs.company) AS company,
  jobs.company_id AS companyId,
  jobs.location,
  jobs.batch AS batch,
  jobs.employment_type AS employmentType,
  jobs.work_mode AS workMode,
  jobs.candidate_eligibility AS candidateEligibility,
  jobs.description,
  jobs.salary_range AS salaryRange,
  jobs.application_url AS applicationUrl,
  jobs.years_experience AS yearsExperience,
  jobs.high_priority AS highPriority,
  jobs.expired_at AS expiredAt,
  jobs.status,
  jobs.created_at AS createdAt`;

const JOB_SELECT = `SELECT ${JOB_FIELDS}
  FROM jobs
  LEFT JOIN companies ON companies.id = jobs.company_id`;

async function listJobs(
  database,
  query,
  includeExpired,
  employmentTypes = null,
  experienceRequired = null,
  companyName = null,
  highPriorityOnly = false,
) {
  const search = query.trim();
  const filters = ["jobs.status = 'published'"];
  const values = [];
  if (employmentTypes?.length) {
    filters.push(`jobs.employment_type IN (${employmentTypes.map(() => "?").join(", ")})`);
    values.push(...employmentTypes);
  }
  if (experienceRequired) {
    filters.push("jobs.candidate_eligibility = ?");
    values.push(experienceRequired);
  }
  if (companyName) {
    filters.push("lower(trim(COALESCE(companies.name, jobs.company))) = lower(trim(?))");
    values.push(companyName);
  }
  if (highPriorityOnly) {
    filters.push("jobs.high_priority = 1");
  }
  if (!includeExpired) {
    filters.push("jobs.expired_at IS NULL");
  }
  if (search) {
    filters.push(`(
      instr(lower(jobs.title), lower(?)) > 0
      OR instr(lower(COALESCE(jobs.role_type, '')), lower(?)) > 0
      OR instr(lower(COALESCE(companies.name, jobs.company)), lower(?)) > 0
      OR instr(lower(jobs.location), lower(?)) > 0
      OR instr(lower(jobs.description), lower(?)) > 0
    )`);
    values.push(search, search, search, search, search);
  }

  const statement = database
    .prepare(
      `${JOB_SELECT}
       WHERE ${filters.join(" AND ")}
       ORDER BY jobs.created_at DESC
       LIMIT 100`,
    );
  const boundStatement = values.length ? statement.bind(...values) : statement;
  const result = await boundStatement.all();
  if (!Array.isArray(result.results)) {
    throw new Error("The jobs query returned an invalid result set.");
  }
  return result.results;
}

export async function listPublishedJobs(
  database,
  query = "",
  userId,
  employmentType = null,
  experienceRequired = null,
  companyName = null,
  highPriorityOnly = false,
) {
  const jobs = await listJobs(
    database,
    query,
    false,
    employmentType ? [employmentType] : null,
    experienceRequired,
    companyName,
    highPriorityOnly,
  );
  if (!jobs.length) {
    return jobs;
  }

  const jobIdPlaceholders = jobs.map(() => "?").join(", ");
  const [savedResult, appliedResult] = await Promise.all([
    database
      .prepare(
        `SELECT job_id
         FROM saved_jobs
         WHERE user_id = ? AND job_id IN (${jobIdPlaceholders})`,
      )
      .bind(userId, ...jobs.map((job) => job.id))
      .all(),
    database
      .prepare(
        `SELECT job_id
         FROM applied_jobs
         WHERE user_id = ? AND job_id IN (${jobIdPlaceholders})`,
      )
      .bind(userId, ...jobs.map((job) => job.id))
      .all(),
  ]);
  if (!Array.isArray(savedResult.results) || !Array.isArray(appliedResult.results)) {
    throw new Error("The saved or applied jobs query returned an invalid result set.");
  }
  const savedJobIds = new Set(savedResult.results.map((row) => row.job_id));
  const appliedJobIds = new Set(appliedResult.results.map((row) => row.job_id));
  return jobs.map((job) => ({
    ...job,
    isSaved: savedJobIds.has(job.id),
    isApplied: appliedJobIds.has(job.id),
  }));
}

export async function listCompanyOpportunityCounts(database) {
  const result = await database
    .prepare(
      `SELECT
         MIN(COALESCE(companies.name, jobs.company)) AS company,
         COUNT(*) AS opportunities
       FROM jobs
       LEFT JOIN companies ON companies.id = jobs.company_id
       WHERE jobs.status = 'published'
         AND jobs.expired_at IS NULL
         AND length(trim(COALESCE(companies.name, jobs.company))) > 0
       GROUP BY lower(trim(COALESCE(companies.name, jobs.company)))
       ORDER BY opportunities DESC, company COLLATE NOCASE ASC`,
    )
    .all();
  if (!Array.isArray(result.results)) {
    throw new Error("The company opportunity query returned an invalid result set.");
  }
  return result.results;
}

export async function listAdminJobs(database, employmentTypes = null, companyName = null) {
  return listJobs(database, "", false, employmentTypes, null, companyName);
}

export async function listSavedJobs(database, userId) {
  const result = await database
    .prepare(
      `SELECT ${JOB_FIELDS},
        1 AS isSaved,
        EXISTS (
          SELECT 1 FROM applied_jobs
          WHERE applied_jobs.user_id = saved_jobs.user_id
            AND applied_jobs.job_id = saved_jobs.job_id
        ) AS isApplied
       FROM saved_jobs
       JOIN jobs ON jobs.id = saved_jobs.job_id
       LEFT JOIN companies ON companies.id = jobs.company_id
       WHERE saved_jobs.user_id = ?
         AND jobs.status = 'published'
         AND jobs.expired_at IS NULL
       ORDER BY saved_jobs.created_at DESC
       LIMIT 100`,
    )
    .bind(userId)
    .all();
  if (!Array.isArray(result.results)) {
    throw new Error("The saved jobs query returned an invalid result set.");
  }
  return result.results;
}

export async function listAppliedJobs(database, userId) {
  const result = await database
    .prepare(
      `SELECT ${JOB_FIELDS},
        applied_jobs.got_interview AS gotInterview,
        1 AS isApplied,
        EXISTS (
          SELECT 1 FROM saved_jobs
          WHERE saved_jobs.user_id = applied_jobs.user_id
            AND saved_jobs.job_id = applied_jobs.job_id
        ) AS isSaved
       FROM applied_jobs
       JOIN jobs ON jobs.id = applied_jobs.job_id
       LEFT JOIN companies ON companies.id = jobs.company_id
       WHERE applied_jobs.user_id = ?
       ORDER BY applied_jobs.applied_at DESC
       LIMIT 100`,
    )
    .bind(userId)
    .all();
  if (!Array.isArray(result.results)) {
    throw new Error("The applied jobs query returned an invalid result set.");
  }
  return result.results;
}

export async function updateAppliedJobInterviewStatus(database, userId, jobId, gotInterview) {
  const result = await database
    .prepare(
      `UPDATE applied_jobs
       SET got_interview = ?
       WHERE user_id = ? AND job_id = ?`,
    )
    .bind(gotInterview ? 1 : 0, userId, jobId)
    .run();
  const changes = result.meta?.changes ?? result.changes;
  if (!Number.isInteger(changes)) {
    throw new Error("The applied job interview update returned an invalid result.");
  }
  return changes > 0;
}

export async function createJob(database, values) {
  const id = crypto.randomUUID();
  await database
    .prepare(
      `INSERT INTO jobs
        (id, title, role_type, company, company_id, location, batch, employment_type, work_mode, candidate_eligibility, description, salary_range, application_url, years_experience, high_priority, status, next_application_check_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+72 hours'))`,
    )
    .bind(
      id,
      values.title,
      values.roleType || null,
      values.company,
      values.companyId,
      values.location,
      values.batch,
      values.employmentType,
      values.workMode,
      values.candidateEligibility,
      values.description,
      values.salaryRange || null,
      values.applicationUrl,
      values.yearsExperience,
      values.highPriority ? 1 : 0,
    )
    .run();

  const job = await database
    .prepare(`${JOB_SELECT} WHERE jobs.id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (!job) {
    throw new Error("The published job could not be reloaded.");
  }
  return job;
}

export async function updateJob(database, id, values) {
  const existingJob = await database
    .prepare("SELECT application_url AS applicationUrl FROM jobs WHERE id = ? LIMIT 1")
    .bind(id)
    .first();
  if (!existingJob) {
    return null;
  }

  const applicationUrlChanged = existingJob.applicationUrl !== values.applicationUrl;
  await database
    .prepare(
      `UPDATE jobs SET
        title = ?,
        role_type = ?,
        company = ?,
        company_id = ?,
        location = ?,
        batch = ?,
        employment_type = ?,
        work_mode = ?,
        candidate_eligibility = ?,
        description = ?,
        salary_range = ?,
        application_url = ?,
        years_experience = ?,
        high_priority = ?,
        expired_at = CASE WHEN ? THEN NULL ELSE expired_at END,
        next_application_check_at = CASE
          WHEN ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+72 hours')
          ELSE next_application_check_at
        END
       WHERE id = ?`,
    )
    .bind(
      values.title,
      values.roleType || null,
      values.company,
      values.companyId,
      values.location,
      values.batch,
      values.employmentType,
      values.workMode,
      values.candidateEligibility,
      values.description,
      values.salaryRange || null,
      values.applicationUrl,
      values.yearsExperience,
      values.highPriority ? 1 : 0,
      applicationUrlChanged ? 1 : 0,
      applicationUrlChanged ? 1 : 0,
      id,
    )
    .run();

  const job = await database
    .prepare(`${JOB_SELECT} WHERE jobs.id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (!job) {
    throw new Error("The updated job could not be reloaded.");
  }
  return job;
}

export async function unpublishJob(database, id) {
  const result = await database
    .prepare("UPDATE jobs SET status = 'draft' WHERE id = ? AND status = 'published'")
    .bind(id)
    .run();
  return Number(result.meta?.changes ?? result.changes ?? 0) > 0;
}
