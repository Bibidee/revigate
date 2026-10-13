import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(projectRoot, "node_modules", "genlayer", "package.json");
if (!existsSync(manifestPath)) throw new Error("Repository-local GenLayer CLI is not installed. Refusing to fall back to any parent or global package.");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== "0.39.1") throw new Error(`Local GenLayer CLI version ${manifest.version} found; exactly 0.39.1 is required.`);
const name = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.genlayer;
if (!name) throw new Error("Pinned local package does not expose the genlayer CLI binary.");
const result = spawnSync(process.execPath, [resolve(dirname(manifestPath), name), ...process.argv.slice(2)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
