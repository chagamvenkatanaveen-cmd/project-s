import { readFile, writeFile } from "node:fs/promises";
import { emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
import { hashPassword } from "../lib/auth.js";
import { isValidPassword } from "../lib/passwordValidation.js";

function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command from an interactive terminal.");
  }

  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(prompt);

  return new Promise((resolve, reject) => {
    let value = "";

    function cleanup() {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    }

    function onKeypress(character, key = {}) {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Password entry cancelled."));
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(value);
        return;
      }
      if (key.name === "backspace") {
        value = Array.from(value).slice(0, -1).join("");
        return;
      }
      if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    }

    stdin.on("keypress", onKeypress);
  });
}

function replaceVariable(lines, name, value) {
  let replaced = false;
  const updated = [];
  for (const line of lines) {
    if (new RegExp(`^\\s*${name}\\s*=`).test(line)) {
      if (!replaced) {
        updated.push(`${name}=${value}`);
        replaced = true;
      }
    } else {
      updated.push(line);
    }
  }
  if (!replaced) {
    updated.push(`${name}=${value}`);
  }
  return updated;
}

async function main() {
  const password = await readHidden("New admin password: ");
  if (!isValidPassword(password)) {
    throw new Error("Password must be 9–128 characters.");
  }
  const confirmation = await readHidden("Confirm new admin password: ");
  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  const { hash, salt } = await hashPassword(password);
  let contents = "";
  try {
    contents = await readFile(".dev.vars", "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const newline = contents.includes("\r\n") ? "\r\n" : "\n";
  const hasTrailingNewline = contents.endsWith("\n");
  let lines = contents.split(/\r?\n/);
  if (hasTrailingNewline) {
    lines.pop();
  }
  lines = replaceVariable(lines, "ADMIN_PASSWORD_HASH", hash);
  lines = replaceVariable(lines, "ADMIN_PASSWORD_SALT", salt);
  await writeFile(".dev.vars", `${lines.join(newline)}${hasTrailingNewline ? newline : ""}`, "utf8");

  stdout.write("Updated ADMIN_PASSWORD_HASH and ADMIN_PASSWORD_SALT in .dev.vars.\n");
  stdout.write("Rotate those two secrets in the Cloudflare Worker Production settings using the new values.\n");
}

main().catch((error) => {
  console.error(error.message || "Unable to reset the admin password.");
  process.exitCode = 1;
});
