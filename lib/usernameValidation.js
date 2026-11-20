export function isValidUsername(username) {
  return typeof username === "string" && /^[a-z0-9_]{8,24}$/.test(username);
}
