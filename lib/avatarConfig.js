export const AVATAR_DESIGN_COUNT = 8;

export const DEFAULT_AVATAR_CONFIG = Object.freeze({
  hair: 0,
  skinTone: 2,
  shirt: 0,
  glasses: null,
  scarf: null,
});

export const AVATAR_HAIR_STYLES = [
  "Classic",
  "Side part",
  "Curly",
  "Spiky",
  "Wavy",
  "Long",
  "Coils",
  "Fringe",
];

export const AVATAR_SKIN_TONES = [
  { name: "Porcelain", color: "#F7D8C4" },
  { name: "Light", color: "#F2C6A8" },
  { name: "Warm", color: "#E8B394" },
  { name: "Medium", color: "#D99A78" },
  { name: "Golden", color: "#C77F57" },
  { name: "Deep", color: "#A9663F" },
  { name: "Rich", color: "#815334" },
  { name: "Espresso", color: "#5D3B2E" },
];

export const AVATAR_SHIRT_DESIGNS = [
  { name: "Classic blue", color: "#2563EB", pattern: "plain" },
  { name: "Green stripes", color: "#15803D", pattern: "stripes" },
  { name: "Red panel", color: "#DC2626", pattern: "panel" },
  { name: "Navy polo", color: "#1E3A8A", pattern: "collar" },
  { name: "Teal dots", color: "#0F766E", pattern: "dots" },
  { name: "Purple block", color: "#7E22CE", pattern: "block" },
  { name: "Black zip", color: "#374151", pattern: "zip" },
  { name: "Gold V-neck", color: "#CA8A04", pattern: "vneck" },
];

export const AVATAR_GLASSES_DESIGNS = [
  { name: "Round", shape: "round", color: "#374151" },
  { name: "Square", shape: "square", color: "#1F2937" },
  { name: "Oval", shape: "oval", color: "#6B4F3A" },
  { name: "Aviator", shape: "aviator", color: "#64748B" },
  { name: "Bold", shape: "bold", color: "#111827" },
  { name: "Browline", shape: "browline", color: "#4B5563" },
  { name: "Hexagon", shape: "hexagon", color: "#0F766E" },
  { name: "Sport", shape: "sport", color: "#1D4ED8" },
];

export const AVATAR_SCARF_DESIGNS = [
  { name: "Coral", color: "#E11D48", pattern: "plain" },
  { name: "Ocean", color: "#0284C7", pattern: "stripe" },
  { name: "Forest", color: "#15803D", pattern: "dots" },
  { name: "Violet", color: "#7C3AED", pattern: "plain" },
  { name: "Sunshine", color: "#D97706", pattern: "stripe" },
  { name: "Rose", color: "#DB2777", pattern: "dots" },
  { name: "Slate", color: "#475569", pattern: "stripe" },
  { name: "Mint", color: "#0F766E", pattern: "plain" },
];

function isDesignIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < AVATAR_DESIGN_COUNT;
}

export function validateAvatarConfig(value) {
  if (value === undefined || value === null) {
    return { value: { ...DEFAULT_AVATAR_CONFIG } };
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { error: "Choose valid avatar designs." };
  }

  const config = { ...DEFAULT_AVATAR_CONFIG, ...value };
  if (
    !isDesignIndex(config.hair) ||
    !isDesignIndex(config.skinTone) ||
    !isDesignIndex(config.shirt) ||
    (config.glasses !== null && !isDesignIndex(config.glasses)) ||
    (config.scarf !== null && !isDesignIndex(config.scarf))
  ) {
    return { error: "Choose valid avatar designs." };
  }

  return {
    value: {
      hair: config.hair,
      skinTone: config.skinTone,
      shirt: config.shirt,
      glasses: config.glasses,
      scarf: config.scarf,
    },
  };
}

export function normalizeAvatarConfig(value) {
  return validateAvatarConfig(value).value || { ...DEFAULT_AVATAR_CONFIG };
}
