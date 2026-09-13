import { z } from "zod";
import { MobilityPreference } from "./candidate.js";

export const TargetEventSchema = z.object({
  name: z.string(),
  type: z.string(),
});

export const RoleSchema = z.object({
  role_id: z.string(),
  role_segment: MobilityPreference,
  required_competencies: z.array(z.string()),
  preferred_competencies: z.array(z.string()).optional().default([]),
  visa_validity: z.boolean(),
  target_events: z.array(TargetEventSchema),
  discord_invite_url: z.string().url(),
  title: z.string().optional(),
  employer: z.string().optional(),
});

export const RoleDatabaseSchema = z.array(RoleSchema);

export type Role = z.infer<typeof RoleSchema>;
export type TargetEvent = z.infer<typeof TargetEventSchema>;
