import type { CandidateInput } from "../schemas/candidate.js";
import type { Role } from "../schemas/role.js";

export class NoMatchingRolesError extends Error {
  constructor(mobilityPreference: string) {
    super(`No visa-valid roles found for mobility preference "${mobilityPreference}"`);
    this.name = "NoMatchingRolesError";
  }
}

// Step 1: Validation (Deterministic). No AI involved - pure filtering rules.
export function filterRoles(roles: Role[], candidate: CandidateInput): Role[] {
  const filtered = roles.filter(
    (role) => role.visa_validity && role.role_segment === candidate.mobility_preference
  );

  if (filtered.length === 0) {
    throw new NoMatchingRolesError(candidate.mobility_preference);
  }

  return filtered;
}
