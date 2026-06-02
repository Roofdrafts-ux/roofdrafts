import "server-only";
import { DeepSeekProvider } from "./deepseek";
import type { LLMMessage, LLMProvider } from "./types";

/** No-op provider when nothing is configured — features fall back to deterministic output. */
class DisabledProvider implements LLMProvider {
  readonly name = "disabled";
  readonly enabled = false;
  async complete(): Promise<string> {
    throw new Error("No LLM provider configured (set DEEPSEEK_API_KEY).");
  }
}

/**
 * Select the active LLM provider. Today: DeepSeek when DEEPSEEK_API_KEY is set.
 * To switch to Gemini later: add a GeminiProvider and branch on LLM_PROVIDER here —
 * no caller changes needed.
 */
export function getLLM(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? (process.env.DEEPSEEK_API_KEY ? "deepseek" : "none");
  if (provider === "deepseek" && process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekProvider(process.env.DEEPSEEK_API_KEY, process.env.DEEPSEEK_MODEL ?? "deepseek-chat");
  }
  // Future: if (provider === "gemini" && process.env.GEMINI_API_KEY) return new GeminiProvider(...);
  return new DisabledProvider();
}

export type { LLMMessage, LLMProvider } from "./types";
