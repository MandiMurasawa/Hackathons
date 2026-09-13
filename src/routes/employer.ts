import { Router, type Request, type Response } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { MobilityPreference, CandidateProfileDatabaseSchema, type CandidateProfile } from "../schemas/candidate.js";
import type { Role, TargetEvent } from "../schemas/role.js";
import { validateSkillTaxonomy, InvalidTaxonomyError } from "../data/constraints.js";
import { getRoles, addRole } from "../data/roleStore.js";
import { filterRoles, NoMatchingRolesError } from "../pipeline/validate.js";
import { scoreRoles } from "../pipeline/score.js";
import { setEmployerInterest, getAllPipelineEntries } from "../data/pipelineStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES_PATH = path.join(__dirname, "..", "data", "candidates.json");
const candidates: CandidateProfile[] = CandidateProfileDatabaseSchema.parse(
  JSON.parse(readFileSync(CANDIDATES_PATH, "utf-8"))
);

const DiscordInviteUrl = z
  .string()
  .url()
  .refine(
    (value) => {
      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        return false;
      }
      return (
        parsed.protocol === "https:" &&
        (parsed.hostname === "discord.gg" || parsed.hostname === "discord.com" || parsed.hostname === "www.discord.com")
      );
    },
    { message: "Discord invite link must be an https://discord.gg or https://discord.com URL" }
  );

const RolePostingSchema = z.object({
  title: z.string().min(1),
  employer: z.string().min(1),
  role_segment: MobilityPreference,
  required_skills: z.array(z.string().min(1)).min(1),
  preferred_skills: z.array(z.string().min(1)).default([]),
  discord_invite_url: DiscordInviteUrl.optional().or(z.literal("")),
});

const PipelineUpdateSchema = z.object({
  candidate_id: z.string().min(1),
  role_id: z.string().min(1),
});

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "role";
}

export const employerRouter = Router();

employerRouter.get("/roles", (_req: Request, res: Response) => {
  res.status(200).json(getRoles());
});

employerRouter.post("/roles", (req: Request, res: Response) => {
  const parsed = RolePostingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role posting payload", details: parsed.error.flatten() });
    return;
  }
  const posting = parsed.data;

  try {
    validateSkillTaxonomy("required_skills", posting.required_skills);
    validateSkillTaxonomy("preferred_skills", posting.preferred_skills);
  } catch (error) {
    if (error instanceof InvalidTaxonomyError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  const slug = slugify(`${posting.employer}_${posting.title}`);
  const role_id = `role_${slug}_${getRoles().length + 1}`;
  const target_events: TargetEvent[] = [
    { name: `${posting.employer} Graduate Meetup`, type: "Socialization" },
    { name: `${posting.title} Micro-credential`, type: "Accreditation" },
  ];

  const role: Role = {
    role_id,
    role_segment: posting.role_segment,
    title: posting.title,
    employer: posting.employer,
    required_competencies: posting.required_skills,
    preferred_competencies: posting.preferred_skills,
    visa_validity: true,
    target_events,
    discord_invite_url: posting.discord_invite_url || "https://discord.gg/3TUWQM83A",
  };

  addRole(role);
  res.status(201).json(role);
});

employerRouter.get("/candidates", async (_req: Request, res: Response) => {
  const roles = getRoles();
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const filtered = filterRoles(roles, candidate);
        const topMatch = await scoreRoles(candidate.technical_skills, filtered);
        return {
          candidate_id: candidate.candidate_id,
          code: candidate.code,
          match_percentage: topMatch.gapScorePercentage,
          matched_role_id: topMatch.role.role_id,
        };
      } catch (error) {
        if (error instanceof NoMatchingRolesError) {
          return {
            candidate_id: candidate.candidate_id,
            code: candidate.code,
            match_percentage: 0,
            matched_role_id: null,
          };
        }
        throw error;
      }
    })
  );

  res.status(200).json(results);
});

employerRouter.post("/pipeline", (req: Request, res: Response) => {
  const parsed = PipelineUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid pipeline update payload", details: parsed.error.flatten() });
    return;
  }
  const { candidate_id, role_id } = parsed.data;

  const candidateExists = candidates.some((c) => c.candidate_id === candidate_id);
  if (!candidateExists) {
    res.status(404).json({ error: `Unknown candidate_id "${candidate_id}"` });
    return;
  }

  const roleExists = getRoles().some((r) => r.role_id === role_id);
  if (!roleExists) {
    res.status(404).json({ error: `Unknown role_id "${role_id}"` });
    return;
  }

  const entry = setEmployerInterest(candidate_id, role_id);
  res.status(200).json(entry);
});

employerRouter.get("/pipeline", (_req: Request, res: Response) => {
  res.status(200).json(getAllPipelineEntries());
});
