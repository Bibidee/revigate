import { readFileSync, readdirSync, statSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const forbidden = ["61" + "997", "studio" + "-dev", "studio" + "Devnet"];
const sourceDirs = ["app", "components", "contracts", "lib", "scripts"];
const files = [".env.example", "next.config.ts", "package.json", "vercel.json"];
function collect(dir) {
  for (const name of readdirSync(dir)) {
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) collect(path);
    else files.push(path);
  }
}
for (const dir of sourceDirs) collect(dir);
const violations = files.filter((path) => {
  const body = readFileSync(new URL(`../${path}`, import.meta.url), "utf8").toLowerCase();
  return forbidden.some((needle) => body.includes(needle.toLowerCase()));
});
if (violations.length) throw new Error(`Forbidden network reference found in production sources: ${violations.join(", ")}`);
if (packageJson.devDependencies?.genlayer !== "0.39.1") {
  throw new Error("The repository-local GenLayer CLI must be pinned to exactly 0.39.1.");
}
if (process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID && process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID !== "61999") {
  throw new Error("Only Studionet chain ID 61999 is supported.");
}
console.log("Production sources are restricted to Studionet (61999); local CLI pin is 0.39.1.");
