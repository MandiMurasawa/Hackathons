import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { RoleDatabaseSchema, type Role } from "../schemas/role.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_PATH = path.join(__dirname, "roles.json");

const rawRoles = JSON.parse(readFileSync(ROLES_PATH, "utf-8"));
let roles: Role[] = RoleDatabaseSchema.parse(rawRoles);

export function getRoles(): Role[] {
  return roles;
}

export function addRole(role: Role): void {
  roles.push(role);
}
