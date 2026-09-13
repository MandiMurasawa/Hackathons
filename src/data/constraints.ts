import type { CandidateInput } from "../schemas/candidate.js";

export const VALID_TECH_SKILLS = ["Financial Modelling", "Power BI", "Advanced Excel"] as const;
export const VALID_LANGUAGES = ["English", "Vietnamese", "Mandarin"] as const;
export const VALID_DIALECT_CONTEXTS = [
  "APAC Market Knowledge",
  "Technical Financial Terminology",
  "Client-Facing Communication",
] as const;

export type ValidTechSkill = (typeof VALID_TECH_SKILLS)[number];
export type ValidLanguage = (typeof VALID_LANGUAGES)[number];
export type ValidDialectContext = (typeof VALID_DIALECT_CONTEXTS)[number];

export class InvalidTaxonomyError extends Error {
  constructor(field: string, value: string, allowed: readonly string[]) {
    super(`Invalid value "${value}" for "${field}". Must be one of: ${allowed.join(", ")}`);
    this.name = "InvalidTaxonomyError";
  }
}

const ALL_TAXONOMY_VALUES: readonly string[] = [
  ...VALID_TECH_SKILLS,
  ...VALID_LANGUAGES,
  ...VALID_DIALECT_CONTEXTS,
];

export function validateSkillTaxonomy(field: string, values: string[]): void {
  for (const value of values) {
    if (!ALL_TAXONOMY_VALUES.includes(value)) {
      throw new InvalidTaxonomyError(field, value, ALL_TAXONOMY_VALUES);
    }
  }
}

export function validateConstraints(payload: CandidateInput): void {
  for (const skill of payload.technical_skills) {
    if (!(VALID_TECH_SKILLS as readonly string[]).includes(skill)) {
      throw new InvalidTaxonomyError("technical_skills", skill, VALID_TECH_SKILLS);
    }
  }

  const { language, dialect_context } = payload.language_proficiency;

  if (!(VALID_LANGUAGES as readonly string[]).includes(language)) {
    throw new InvalidTaxonomyError("language_proficiency.language", language, VALID_LANGUAGES);
  }

  if (!(VALID_DIALECT_CONTEXTS as readonly string[]).includes(dialect_context)) {
    throw new InvalidTaxonomyError(
      "language_proficiency.dialect_context",
      dialect_context,
      VALID_DIALECT_CONTEXTS
    );
  }
}
