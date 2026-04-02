import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function rmQuiet(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${path.relative(root, dir) || dir}`);
  } catch (e) {
    console.warn(`Skip ${dir}:`, e?.message || e);
  }
}

console.log(
  "Stop all `next dev` / `next start` processes before cleaning, or .next will break again.",
);
rmQuiet(path.join(root, ".next"));
rmQuiet(path.join(root, "node_modules", ".cache"));
