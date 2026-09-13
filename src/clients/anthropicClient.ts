import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: {
        "anthropic-workspace-id":"wrkspc_01DH8uu115CRnKhyeRkNUHeL",
      }
    });
  }
  return client;
}

const SUBMIT_ROADMAP_TOOL = {
  name: "submit_roadmap",
  description: "Submit the final 3-step action roadmap for the candidate.",
  input_schema: {
    type: "object" as const,
    properties: {
      action_roadmap: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            step_type: {
              type: "string",
              enum: ["Socialization", "Accreditation", "Domain Task"],
            },
            milestone: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["step_type", "milestone", "rationale"],
        },
      },
    },
    required: ["action_roadmap"],
  },
};

export async function requestRoadmap(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [SUBMIT_ROADMAP_TOOL],
    tool_choice: { type: "tool", name: "submit_roadmap" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUseBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("Anthropic response did not include a submit_roadmap tool call");
  }

  const input = toolUseBlock.input as { action_roadmap?: unknown };
  let actionRoadmap = input.action_roadmap;

  // Some models occasionally return this field as a JSON-encoded string
  // instead of a native array (sometimes double-wrapping the whole object).
  if (typeof actionRoadmap === "string") {
    const parsed = JSON.parse(actionRoadmap);
    actionRoadmap = Array.isArray(parsed) ? parsed : parsed.action_roadmap;
  }

  return actionRoadmap;
}
