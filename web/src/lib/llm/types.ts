// Provider-agnostic LLM interface. Swap DeepSeek → Gemini (or any provider) by adding a
// new implementation + selecting it in index.ts — features that use getLLM() don't change.
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompleteOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface LLMProvider {
  readonly name: string;
  /** False when no provider is configured — callers should fall back gracefully. */
  readonly enabled: boolean;
  complete(messages: LLMMessage[], opts?: LLMCompleteOptions): Promise<string>;
}
