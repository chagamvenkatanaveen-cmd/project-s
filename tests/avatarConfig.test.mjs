import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AVATAR_GLASSES_DESIGNS,
  AVATAR_HAIR_STYLES,
  AVATAR_SCARF_DESIGNS,
  AVATAR_SHIRT_DESIGNS,
  AVATAR_SKIN_TONES,
  DEFAULT_AVATAR_CONFIG,
  normalizeAvatarConfig,
  validateAvatarConfig,
} from "../lib/avatarConfig.js";

test("avatar options provide eight designs for each customizable feature", () => {
  assert.equal(AVATAR_HAIR_STYLES.length, 8);
  assert.equal(AVATAR_SKIN_TONES.length, 8);
  assert.equal(AVATAR_SHIRT_DESIGNS.length, 8);
  assert.equal(AVATAR_GLASSES_DESIGNS.length, 8);
  assert.equal(AVATAR_SCARF_DESIGNS.length, 8);
});

test("avatar configuration defaults to the first designs without optional accessories", () => {
  assert.deepEqual(validateAvatarConfig(undefined), {
    value: { ...DEFAULT_AVATAR_CONFIG },
  });
  assert.deepEqual(normalizeAvatarConfig({ hair: 3 }), {
    hair: 3,
    skinTone: DEFAULT_AVATAR_CONFIG.skinTone,
    shirt: DEFAULT_AVATAR_CONFIG.shirt,
    glasses: null,
    scarf: null,
  });
});

test("avatar configuration permits optional accessories to be omitted and rejects invalid designs", () => {
  assert.deepEqual(
    validateAvatarConfig({ hair: 7, skinTone: 0, shirt: 4, glasses: null, scarf: 7 }),
    { value: { hair: 7, skinTone: 0, shirt: 4, glasses: null, scarf: 7 } },
  );
  assert.deepEqual(validateAvatarConfig({ glasses: 8 }), {
    error: "Choose valid avatar designs.",
  });
  assert.deepEqual(validateAvatarConfig([]), {
    error: "Choose valid avatar designs.",
  });
});
