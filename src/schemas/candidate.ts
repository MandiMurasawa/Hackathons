import { z } from "zod";

export const MobilityPreference = z.enum(["Metro_APAC", "Diaspora_SME", "Regional"]);

export const CandidateInputSchema = z.object({
  academic_year: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  technical_skills: z.array(z.string().min(1)).max(10),
  language_proficiency: z.object({
    language: z.string().min(1),
    cefr_level: z.string().min(1),
    dialect_context: z.string().min(1),
  }),
  mobility_preference: MobilityPreference,
});

export type CandidateInput = z.infer<typeof CandidateInputSchema>;

export const CandidateProfileSchema = CandidateInputSchema.extend({
  candidate_id: z.string(),
  code: z.string(),
});

export const CandidateProfileDatabaseSchema = z.array(CandidateProfileSchema);

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
