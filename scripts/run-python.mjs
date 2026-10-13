import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const venvPython = resolve(
  process.cwd(),
  process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python",
);
const requestedArgs = process.argv.slice(2);

const command = existsSync(venvPython) ? venvPython : "uv";
const args = existsSync(venvPython)
  ? requestedArgs
  : ["run", "--frozen", "python", ...requestedArgs];
const result = spawnSync(command, args, { stdio: "inherit", shell: false });

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
