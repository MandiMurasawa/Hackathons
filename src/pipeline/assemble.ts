import type { CandidateInput } from "../schemas/candidate.js";
import type { ActionRoadmap, AnalyzeResult, ScoredRole } from "../types.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildCohortId(candidate: CandidateInput, scored: ScoredRole): string {
  const domainSlug = slugify(scored.role.role_id.split("_")[0]);
  const segmentSlug = slugify(scored.role.role_segment);
  const dialectSlug = slugify(candidate.language_proficiency.dialect_context);
  return `${domainSlug}_${segmentSlug}_yr${candidate.academic_year}_${dialectSlug}`;
}

// Final assembly: pure data shaping into the strict output contract. No
// generation happens here - it only combines results from Steps 1-3.
export function assembleResult(
  candidate: CandidateInput,
  scored: ScoredRole,
  actionRoadmap: ActionRoadmap
): AnalyzeResult {
  return {
    gap_score_percentage: scored.gapScorePercentage,
    assigned_cohort_id: buildCohortId(candidate, scored),
    discord_invite_url: scored.role.discord_invite_url,
    action_roadmap: actionRoadmap,
  };
}
