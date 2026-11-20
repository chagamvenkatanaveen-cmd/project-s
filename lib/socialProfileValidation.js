const PROFILE_URL_CONFIGS = {
  instagram: {
    label: "Instagram",
    hosts: new Set(["instagram.com", "www.instagram.com"]),
    requiresProfilePath: true,
  },
  linkedin: {
    label: "LinkedIn",
    hosts: new Set(["linkedin.com", "www.linkedin.com", "in.linkedin.com"]),
    requiresProfilePath: true,
  },
  leetcode: {
    label: "LeetCode",
    hosts: new Set(["leetcode.com", "www.leetcode.com"]),
    requiresProfilePath: true,
  },
  portfolio: {
    label: "Portfolio",
    hosts: null,
    requiresProfilePath: false,
  },
};

export function validateProfileUrl(value, platform) {
  const config = PROFILE_URL_CONFIGS[platform];
  if (!config) {
    return { error: "Choose a valid social media platform." };
  }
  if (typeof value !== "string") {
    return { error: `Enter a valid ${config.label} profile URL, or leave it blank.` };
  }

  const input = value.trim();
  if (!input) {
    return { value: "" };
  }
  if (input.length > 2048) {
    return { error: `${config.label} profile URLs must be 2,048 characters or fewer.` };
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    return { error: `Enter a valid ${config.label} profile URL, or leave it blank.` };
  }

  if (
    url.protocol !== "https:" ||
    (config.hosts && !config.hosts.has(url.hostname.toLowerCase())) ||
    (config.requiresProfilePath && url.pathname === "/") ||
    url.username ||
    url.password
  ) {
    return { error: `Enter a valid ${config.label} profile URL, or leave it blank.` };
  }

  return { value: url.toString() };
}
