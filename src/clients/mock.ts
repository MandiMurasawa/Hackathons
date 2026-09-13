import type { Role } from "../schemas/role.js";
import type { ActionRoadmap } from "../types.js";

const MOCK_EMBEDDING_DIMS = 128;

function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Deterministic "hashing trick" bag-of-words embedding. Not semantically
// meaningful like a real model embedding, but text sharing words lands in
// the same dimensions, so cosine similarity behaves plausibly for a demo -
// no OpenAI call or API key required.
export function mockEmbedding(text: string): number[] {
  const vector = new Array(MOCK_EMBEDDING_DIMS).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const token of tokens) {
    const index = hashToken(token) % MOCK_EMBEDDING_DIMS;
    vector[index] += 1;
  }
  return vector;
}

// Rule-based stand-in for the Claude call. Mirrors the same staging rules
// from the real system prompt in pipeline/generate.ts, so swapping mock
// mode on/off doesn't change the shape or intent of the output.
export function mockRoadmap(
  skillGapDelta: string[],
  academicYear: number,
  role: Role
): ActionRoadmap {
  const socializationEvent = role.target_events.find((event) => event.type === "Socialization");
  const accreditationEvent = role.target_events.find((event) => event.type === "Accreditation");
  const primaryGap = skillGapDelta[0] ?? role.required_competencies[0];

  const socializationStep = {
    step_type: "Socialization" as const,
    milestone: socializationEvent?.name ?? `Attend a ${role.role_segment} student networking event`,
    rationale: `Year ${academicYear} objective: build local professional context in the ${role.role_segment} track before formal application cycles.`,
  };

  const accreditationStep = {
    step_type: "Accreditation" as const,
    milestone: accreditationEvent?.name ?? `Complete foundational accreditation for "${primaryGap}"`,
    rationale: `Mandatory precursor identified for Year ${academicYear} advancement toward this role.`,
  };

  const domainTaskStep = {
    step_type: "Domain Task" as const,
    milestone: `Complete a hands-on project demonstrating "${primaryGap}"`,
    rationale: `Directly closes the highest-priority skill gap identified for the ${role.role_segment} track (Year ${academicYear}).`,
  };

  // Order mirrors the spec's example: earlier years lead with Socialization,
  // later years lead with Domain Task/Accreditation. All three step types
  // are always present, matching the spec's sample output.
  const orderByYear: Record<number, ActionRoadmap> = {
    1: [socializationStep, accreditationStep, domainTaskStep],
    2: [accreditationStep, socializationStep, domainTaskStep],
    3: [accreditationStep, domainTaskStep, socializationStep],
    4: [domainTaskStep, accreditationStep, socializationStep],
  };

  return orderByYear[academicYear] ?? orderByYear[1];
}
