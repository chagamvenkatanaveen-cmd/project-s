import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPersonalSettingsAccessToken,
  hasPersonalSettingsAccess,
} from "../lib/personalSettingsAccess.js";

const now = Date.UTC(2026, 10, 18, 12);
const sessionToken = "test-session-token";

function createRequest(token, session = sessionToken) {
  return new Request("https://example.test/api/users/account", {
    headers: {
      cookie: `slipcord_session=${session}; slipcord_personal_settings_access=${token}`,
    },
  });
}

test("personal settings access is valid only for its user and active session", async () => {
  const token = await createPersonalSettingsAccessToken("user-1", sessionToken, now);
  assert.equal(await hasPersonalSettingsAccess(createRequest(token), "user-1", sessionToken, now), true);
  assert.equal(await hasPersonalSettingsAccess(createRequest(token), "user-2", sessionToken, now), false);
  assert.equal(
    await hasPersonalSettingsAccess(createRequest(token, "other-session"), "user-1", "other-session", now),
    false,
  );
});

test("personal settings access expires after its short authorization window", async () => {
  const token = await createPersonalSettingsAccessToken("user-1", sessionToken, now);
  assert.equal(
    await hasPersonalSettingsAccess(createRequest(token), "user-1", sessionToken, now + 16 * 60 * 1000),
    false,
  );
});

test("malformed personal settings access tokens are rejected", async () => {
  assert.equal(
    await hasPersonalSettingsAccess(createRequest("invalid.!"), "user-1", sessionToken, now),
    false,
  );
});
