import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDueApplicationJobs } from "../lib/jobExpiration.js";

function createDatabase() {
  const updates = [];
  const database = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async all() {
          return {
            results: [{ id: "job-1", applicationUrl: "https://careers.example/jobs/1" }],
          };
        },
        async run() {
          updates.push({ sql, values: this.values });
          return { success: true };
        },
      };
    },
  };
  return { database, updates };
}

test("a removed application page expires the job", async () => {
  const { database, updates } = createDatabase();
  const result = await checkDueApplicationJobs(database, {
    scheduledAt: Date.UTC(2026, 10, 16),
    fetchImpl: async () => ({ status: 404 }),
  });

  assert.deepEqual(result, { checked: 1, expired: 1 });
  assert.equal(updates[0].values[1], 1);
});

test("a temporary server error does not expire the job", async () => {
  const { database, updates } = createDatabase();
  const result = await checkDueApplicationJobs(database, {
    scheduledAt: Date.UTC(2026, 10, 16),
    fetchImpl: async () => ({ status: 503, ok: false }),
  });

  assert.deepEqual(result, { checked: 1, expired: 0 });
  assert.equal(updates[0].values[1], 0);
});
