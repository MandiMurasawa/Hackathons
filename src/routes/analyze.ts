import { Router, type Request, type Response } from "express";
import { CandidateInputSchema } from "../schemas/candidate.js";
import { validateConstraints, InvalidTaxonomyError } from "../data/constraints.js";
import { filterRoles, NoMatchingRolesError } from "../pipeline/validate.js";
import { scoreRoles } from "../pipeline/score.js";
import { generateRoadmap } from "../pipeline/generate.js";
import { assembleResult } from "../pipeline/assemble.js";
import { getRoles } from "../data/roleStore.js";

export const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (req: Request, res: Response) => {
  const parsedCandidate = CandidateInputSchema.safeParse(req.body);
  if (!parsedCandidate.success) {
    res.status(400).json({
      error: "Invalid candidate payload",
      details: parsedCandidate.error.flatten(),
    });
    return;
  }
  const candidate = parsedCandidate.data;

  try {
    validateConstraints(candidate);
  } catch (error) {
    if (error instanceof InvalidTaxonomyError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  let filteredRoles;
  try {
    filteredRoles = filterRoles(getRoles(), candidate);
  } catch (error) {
    if (error instanceof NoMatchingRolesError) {
      res.status(422).json({ error: error.message });
      return;
    }
    throw error;
  }

  try {
    const topMatch = await scoreRoles(candidate.technical_skills, filteredRoles);
    const actionRoadmap = await generateRoadmap(
      topMatch.skillGapDelta,
      candidate.academic_year,
      topMatch.role
    );
    const result = assembleResult(candidate, topMatch, actionRoadmap);
    res.status(200).json(result);
  } catch (error) {
    console.error("Pipeline failure in /api/analyze:", error);
    res.status(502).json({ error: "Upstream AI service error while generating the roadmap" });
  }
});
