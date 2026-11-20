export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 9 && password.length <= 128;
}
