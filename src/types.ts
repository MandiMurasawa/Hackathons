import { z } from "zod";
import type { Role } from "./schemas/role.js";

export const StepType = z.enum(["Socialization", "Accreditation", "Domain Task"]);

export const ActionRoadmapItemSchema = z.object({
  step_type: StepType,
  milestone: z.string().min(1),
  rationale: z.string().min(1),
});

export const ActionRoadmapSchema = z.array(ActionRoadmapItemSchema).length(3);

export type ActionRoadmapItem = z.infer<typeof ActionRoadmapItemSchema>;
export type ActionRoadmap = z.infer<typeof ActionRoadmapSchema>;

export interface ScoredRole {
  role: Role;
  gapScorePercentage: number;
  skillGapDelta: string[];
}

export interface AnalyzeResult {
  gap_score_percentage: number;
  assigned_cohort_id: string;
  discord_invite_url: string;
  action_roadmap: ActionRoadmapItem[];
}
