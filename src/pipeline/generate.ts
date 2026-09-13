import { requestRoadmap } from "../clients/anthropicClient.js";
import { mockRoadmap } from "../clients/mock.js";
import { ActionRoadmapSchema, type ActionRoadmap } from "../types.js";
import type { Role } from "../schemas/role.js";
import { VALID_TECH_SKILLS, VALID_LANGUAGES, VALID_DIALECT_CONTEXTS } from "../data/constraints.js";

const SYSTEM_PROMPT = `You are a deterministic action-roadmap generator for an international student career-matching engine.

Rules (must be followed exactly):
1. Output exactly 3 steps via the submit_roadmap tool. Never more, never fewer.
2. Each step's "step_type" must be exactly one of: "Socialization", "Accreditation", "Domain Task".
3. Stage the roadmap by academic year:
   - Year 1: prioritize "Socialization" steps (local professional context before formal application cycles). At least 2 of the 3 steps should be "Socialization" or lead directly into it.
   - Year 2: balance "Socialization" and "Accreditation" (formal certifications/compliance needed before site visits or applications).
   - Year 3: prioritize "Accreditation" and "Domain Task" (formal readiness and demonstrable domain skill).
   - Year 4: prioritize "Domain Task" (direct job-readiness and application-facing skill demonstration).
4. Use only the provided target_events as the basis for "Socialization" and "Accreditation" milestones where applicable. Do not invent employer names, events, or credentials that were not provided or clearly implied by the skill gap delta.
5. Each "rationale" must explicitly reference the candidate's academic_year and tie back to either a target_event or a specific item from the skill_gap_delta.
6. Do not output any text outside of the submit_roadmap tool call.
7. The candidate's technical skills, language, and dialect context are strictly limited to the following fixed taxonomy. You must not generate, hallucinate, or assume any skill, gap, strength, or context outside these lists:
   - Technical skills: ${VALID_TECH_SKILLS.join(", ")}
   - Languages: ${VALID_LANGUAGES.join(", ")}
   - Dialect contexts: ${VALID_DIALECT_CONTEXTS.join(", ")}
   Every milestone and rationale must be phrased strictly in terms of these values and the provided skill_gap_delta/target_events. Do not invent adjacent or related skills that are not in these lists.`;

function buildUserPrompt(skillGapDelta: string[], academicYear: number, role: Role): string {
  return JSON.stringify(
    {
      skill_gap_delta: skillGapDelta,
      academic_year: academicYear,
      target_events: role.target_events,
    },
    null,
    2
  );
}

// Step 3: Action Generation (Generative AI). Only the LLM call lives here;
// the deterministic inputs (skill_gap_delta, academic_year, target_events)
// are computed upstream in Steps 1-2.
export async function generateRoadmap(
  skillGapDelta: string[],
  academicYear: number,
  role: Role
): Promise<ActionRoadmap> {
  if (process.env.MOCK_MODE === "true") {
    return mockRoadmap(skillGapDelta, academicYear, role);
  }

  const userPrompt = buildUserPrompt(skillGapDelta, academicYear, role);

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await requestRoadmap(SYSTEM_PROMPT, userPrompt);
    const parsed = ActionRoadmapSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }
    console.error(`[DEBUG] attempt ${attempt} raw response:`, JSON.stringify(raw, null, 2));
    console.error(`[DEBUG] attempt ${attempt} zod error:`, JSON.stringify(parsed.error.format(), null, 2));
  }

  throw new Error("LLM failed to produce a valid 3-step action roadmap after retry");
}
