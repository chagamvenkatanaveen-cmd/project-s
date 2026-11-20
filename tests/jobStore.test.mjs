import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { test } from "node:test";
import {
  createJob,
  listAdminJobs,
  listAppliedJobs,
  listCompanyOpportunityCounts,
  listPublishedJobs,
  unpublishJob,
  updateAppliedJobInterviewStatus,
  updateJob,
} from "../lib/jobStore.js";

function createDatabase() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE jobs (
      id TEXT PRIMARY KEY,
      title TEXT,
      role_type TEXT,
      company TEXT,
      company_id TEXT,
      location TEXT,
      batch TEXT NOT NULL DEFAULT '',
      employment_type TEXT,
      work_mode TEXT,
      candidate_eligibility TEXT,
      description TEXT,
      salary_range TEXT,
      application_url TEXT,
      years_experience INTEGER,
      high_priority INTEGER NOT NULL DEFAULT 0,
      expired_at TEXT,
      status TEXT,
      next_application_check_at TEXT,
      created_at TEXT
    );
    CREATE TABLE companies (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE saved_jobs (user_id TEXT, job_id TEXT, created_at TEXT);
    CREATE TABLE applied_jobs (
      user_id TEXT,
      job_id TEXT,
      applied_at TEXT,
      got_interview INTEGER NOT NULL DEFAULT 0
    );
  `);

  const database = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...this.values) };
        },
        async first() {
          return sqlite.prepare(sql).get(...this.values) || null;
        },
        async run() {
          return sqlite.prepare(sql).run(...this.values);
        },
      };
    },
  };

  sqlite.prepare(
    `INSERT INTO jobs
      (id, title, role_type, company, company_id, location, employment_type,
       work_mode, candidate_eligibility, description, salary_range, application_url,
       years_experience, expired_at, status, created_at)
     VALUES (?, ?, NULL, ?, NULL, ?, ?, 'Remote', 'freshers', 'Description',
             NULL, 'https://careers.example/job', 0, ?, 'published', ?)`,
  ).run("expired", "Expired internship", "Example Co", "Remote", "Intern", "2026-11-16", "2026-11-01");
  sqlite.prepare(
    `INSERT INTO jobs
      (id, title, role_type, company, company_id, location, employment_type,
       work_mode, candidate_eligibility, description, salary_range, application_url,
       years_experience, expired_at, status, created_at)
     VALUES (?, ?, NULL, ?, NULL, ?, ?, 'Remote', 'freshers', 'Description',
             NULL, 'https://careers.example/job', 0, NULL, 'published', ?)`,
  ).run("active", "Active internship", "Example Co", "Remote", "Intern", "2026-11-15");
  sqlite.prepare(
    "INSERT INTO applied_jobs (user_id, job_id, applied_at) VALUES (?, ?, ?)",
  ).run("user-1", "expired", "2026-11-02");

  return { database, sqlite };
}

test("expired jobs leave active lists but remain in applied history", async () => {
  const { database, sqlite } = createDatabase();
  try {
    const [adminJobs, userJobs, appliedJobs] = await Promise.all([
      listAdminJobs(database),
      listPublishedJobs(database, "", "user-1"),
      listAppliedJobs(database, "user-1"),
    ]);

    assert.deepEqual(adminJobs.map((job) => job.id), ["active"]);
    assert.deepEqual(userJobs.map((job) => job.id), ["active"]);
    assert.deepEqual(appliedJobs.map((job) => job.id), ["expired"]);
  } finally {
    sqlite.close();
  }
});

test("students can mark and clear interview status only on their applied jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    assert.equal(await updateAppliedJobInterviewStatus(database, "user-1", "expired", true), true);
    assert.equal(await updateAppliedJobInterviewStatus(database, "another-user", "expired", true), false);

    const [markedJob] = await listAppliedJobs(database, "user-1");
    assert.equal(markedJob.gotInterview, 1);

    assert.equal(await updateAppliedJobInterviewStatus(database, "user-1", "expired", false), true);
    const [unmarkedJob] = await listAppliedJobs(database, "user-1");
    assert.equal(unmarkedJob.gotInterview, 0);
  } finally {
    sqlite.close();
  }
});

test("job type filter returns only matching active jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    const jobs = await listPublishedJobs(database, "", "user-1", "Intern");
    assert.deepEqual(jobs.map((job) => job.id), ["active"]);
  } finally {
    sqlite.close();
  }
});

test("experience requirement filter returns only matching active jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    const insertJob = sqlite.prepare(
      `INSERT INTO jobs
        (id, title, company, location, employment_type, work_mode, candidate_eligibility,
         description, application_url, years_experience, status, created_at)
       VALUES (?, ?, 'Example Co', 'Remote', ?, 'Remote', ?, 'Description',
               'https://careers.example/job', ?, 'published', ?)`,
    );
    insertJob.run("experienced", "Experienced role", "Full-time", "experienced", 3, "2026-11-14");
    insertJob.run("student", "Student role", "Intern", "student", 0, "2026-11-13");

    const jobs = await listPublishedJobs(database, "", "user-1", null, "experienced");
    assert.deepEqual(jobs.map((job) => job.id), ["experienced"]);
  } finally {
    sqlite.close();
  }
});

test("high-priority filter returns only high-priority active jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    sqlite.prepare("UPDATE jobs SET high_priority = 1 WHERE id = ?").run("active");
    sqlite.prepare(
      `INSERT INTO jobs
        (id, title, company, location, employment_type, work_mode, candidate_eligibility,
         description, application_url, years_experience, high_priority, status, created_at)
       VALUES (?, ?, 'Example Co', 'Remote', 'Intern', 'Remote', 'freshers',
               'Description', 'https://careers.example/job', 0, 0, 'published', ?)`,
    ).run("active-low-priority", "Standard role", "2026-11-14");

    const jobs = await listPublishedJobs(database, "", "user-1", null, null, null, true);
    assert.deepEqual(jobs.map((job) => job.id), ["active"]);
  } finally {
    sqlite.close();
  }
});

test("company opportunity counts include only published non-expired jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    sqlite.prepare("INSERT INTO companies (id, name) VALUES (?, ?)").run("company-1", "Example Co");
    sqlite.prepare("UPDATE jobs SET company_id = ? WHERE id = ?").run("company-1", "active");
    sqlite.prepare(
      `INSERT INTO jobs
        (id, title, company, company_id, location, employment_type, work_mode,
         candidate_eligibility, description, years_experience, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "active-2",
      "Another role",
      "Example Co",
      "company-1",
      "Remote",
      "Full-time",
      "Remote",
      "freshers",
      "Description",
      0,
      "published",
      "2026-11-14",
    );

    const companies = await listCompanyOpportunityCounts(database);
    assert.deepEqual(companies, [{ company: "Example Co", opportunities: 2 }]);
  } finally {
    sqlite.close();
  }
});

test("company filter returns only that company's active jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    const jobs = await listPublishedJobs(database, "", "user-1", null, null, " example co ");
    assert.deepEqual(jobs.map((job) => job.id), ["active"]);
  } finally {
    sqlite.close();
  }
});

test("admin company filter returns only matching active jobs", async () => {
  const { database, sqlite } = createDatabase();
  try {
    sqlite.prepare(
      `INSERT INTO jobs
        (id, title, company, location, employment_type, work_mode, candidate_eligibility,
         description, application_url, years_experience, status, created_at)
       VALUES (?, ?, ?, 'Remote', 'Full-time', 'Remote', 'freshers',
               'Description', 'https://careers.example/job', 0, 'published', ?)`,
    ).run("other-company", "Another role", "Other Co", "2026-11-14");

    const jobs = await listAdminJobs(database, null, " example co ");
    assert.deepEqual(jobs.map((job) => job.id), ["active"]);
  } finally {
    sqlite.close();
  }
});

test("admin create and edit preserve the high-priority choice", async () => {
  const { database, sqlite } = createDatabase();
  const values = {
    title: "Priority role",
    batch: "2026",
    roleType: "",
    company: "Example Co",
    companyId: "company-1",
    location: "Remote",
    employmentType: "Full-time",
    workMode: "Remote",
    candidateEligibility: "freshers",
    description: "Description",
    salaryRange: "",
    applicationUrl: "https://careers.example/job",
    yearsExperience: 0,
    highPriority: true,
  };

  try {
    const createdJob = await createJob(database, values);
    assert.equal(createdJob.highPriority, 1);

    const updatedJob = await updateJob(database, createdJob.id, {
      ...values,
      title: "Updated priority role",
      highPriority: false,
    });
    assert.equal(updatedJob.highPriority, 0);
  } finally {
    sqlite.close();
  }
});

test("unpublishing a job preserves its application history", async () => {
  const { database, sqlite } = createDatabase();
  try {
    sqlite.prepare(
      "INSERT INTO applied_jobs (user_id, job_id, applied_at) VALUES (?, ?, ?)",
    ).run("user-1", "active", "2026-11-16");

    assert.equal(await unpublishJob(database, "active"), true);
    assert.equal(await unpublishJob(database, "active"), false);

    const [activeJobs, appliedJobs] = await Promise.all([
      listAdminJobs(database),
      listAppliedJobs(database, "user-1"),
    ]);
    assert.deepEqual(activeJobs.map((job) => job.id), []);
    assert.deepEqual(appliedJobs.map((job) => job.id), ["active", "expired"]);
    assert.equal(appliedJobs[0].title, "Active internship");
    assert.equal(
      (await database.prepare("SELECT status FROM jobs WHERE id = ?").bind("active").first()).status,
      "draft",
    );
  } finally {
    sqlite.close();
  }
});
