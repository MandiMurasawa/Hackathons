import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist/data", { recursive: true });
copyFileSync("src/data/roles.json", "dist/data/roles.json");
copyFileSync("src/data/candidates.json", "dist/data/candidates.json");
