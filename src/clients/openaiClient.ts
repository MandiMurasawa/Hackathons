import OpenAI from "openai";
import { mockEmbedding } from "./mock.js";

const EMBEDDING_MODEL = "text-embedding-ada-002";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (process.env.MOCK_MODE === "true") {
    return mockEmbedding(text);
  }

  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}
