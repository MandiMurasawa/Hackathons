export interface PipelineEntry {
  candidate_id: string;
  role_id: string;
  stage: string;
}

const pipeline = new Map<string, PipelineEntry>();

function pipelineKey(candidateId: string, roleId: string): string {
  return `${candidateId}:${roleId}`;
}

export function setEmployerInterest(candidateId: string, roleId: string): PipelineEntry {
  const entry: PipelineEntry = { candidate_id: candidateId, role_id: roleId, stage: "Employer interest" };
  pipeline.set(pipelineKey(candidateId, roleId), entry);
  return entry;
}

export function getAllPipelineEntries(): PipelineEntry[] {
  return Array.from(pipeline.values());
}
