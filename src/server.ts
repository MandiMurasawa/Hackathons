import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { analyzeRouter } from "./routes/analyze.js";
import { employerRouter } from "./routes/employer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function requireEnv(name: string): void {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const mockMode = process.env.MOCK_MODE === "true";

if (mockMode) {
  console.log("MOCK_MODE=true: using stubbed embeddings and roadmap generation, no API keys required.");
} else {
  requireEnv("OPENAI_API_KEY");
  requireEnv("ANTHROPIC_API_KEY");
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api", analyzeRouter);
app.use("/api/employer", employerRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Zero Trust AI Action Engine listening on port ${port}`);
});
