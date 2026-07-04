// CLAUDE.md's locked AI decision: "routed by complexity — simple tasks →
// cheap/fast model, complex → capable model. Single provider abstraction;
// model choice behind one callModel(complexity, messages) function."
//
// Provider: the Anthropic Messages API, called with plain fetch (no SDK
// dependency). Nothing in the app may talk to a model except through
// callModel, and every feature built on it must degrade gracefully when
// isAiConfigured() is false — the app has run without an AI backend since
// Phase 1 and must keep booting without one.

export type ModelComplexity = "simple" | "complex";

export interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_MODELS: Record<ModelComplexity, string> = {
  simple: process.env.AI_MODEL_SIMPLE ?? "claude-haiku-4-5-20251001",
  complex: process.env.AI_MODEL_COMPLEX ?? "claude-sonnet-5",
};

// Overridable so tests can point at a local stub and so the API can be
// reached through a gateway if one is ever required.
const BASE_URL = () => process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";

export class AiError extends Error {}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callModel(
  complexity: ModelComplexity,
  messages: ModelMessage[],
  options?: { system?: string; maxTokens?: number },
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiError("No AI backend is configured (ANTHROPIC_API_KEY is not set).");
  }

  const response = await fetch(`${BASE_URL()}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_MODELS[complexity],
      max_tokens: options?.maxTokens ?? 2048,
      ...(options?.system ? { system: options.system } : {}),
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AiError(`Model call failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");

  if (!text) {
    throw new AiError("Model returned no text content.");
  }
  return text;
}
