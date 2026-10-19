import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDirectory = path.join(projectRoot, "frontend");
const pagesDirectory = path.join(projectRoot, "docs");

mkdirSync(pagesDirectory, { recursive: true });
cpSync(frontendDirectory, pagesDirectory, { recursive: true });
console.log("Frontend copiado a docs/ para GitHub Pages.");
