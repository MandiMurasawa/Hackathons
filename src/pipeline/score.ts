import type { Role } from "../schemas/role.js";
import type { ScoredRole } from "../types.js";
import { getEmbedding } from "../clients/openaiClient.js";

const GAP_SIMILARITY_THRESHOLD = 0.75;

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function centroid(vectors: number[][]): number[] {
  const dims = vectors[0].length;
  const sum = new Array(dims).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dims; i++) sum[i] += vec[i];
  }
  return sum.map((v) => v / vectors.length);
}

// Step 2: Gap Scoring (Vector Math). Embeddings come from OpenAI; the rest is
// deterministic arithmetic, kept separate from any generative step.
export async function scoreRole(candidateSkills: string[], role: Role): Promise<ScoredRole> {
  const [skillEmbeddings, competencyEmbeddings] = await Promise.all([
    Promise.all(candidateSkills.map((skill) => getEmbedding(skill))),
    Promise.all(role.required_competencies.map((competency) => getEmbedding(competency))),
  ]);

  const skillCentroid = centroid(skillEmbeddings);
  const competencyCentroid = centroid(competencyEmbeddings);
  const overallSimilarity = cosineSimilarity(skillCentroid, competencyCentroid);
  const gapScorePercentage = Math.round(Math.max(0, Math.min(1, overallSimilarity)) * 100);

  const skillGapDelta = role.required_competencies.filter((_, competencyIndex) => {
    const competencyEmbedding = competencyEmbeddings[competencyIndex];
    const bestMatch = Math.max(
      ...skillEmbeddings.map((skillEmbedding) => cosineSimilarity(skillEmbedding, competencyEmbedding))
    );
    return bestMatch < GAP_SIMILARITY_THRESHOLD;
  });

  return { role, gapScorePercentage, skillGapDelta };
}

export async function scoreRoles(candidateSkills: string[], roles: Role[]): Promise<ScoredRole> {
  const scored = await Promise.all(roles.map((role) => scoreRole(candidateSkills, role)));
  return scored.reduce((best, current) =>
    current.gapScorePercentage > best.gapScorePercentage ? current : best
  );
}
