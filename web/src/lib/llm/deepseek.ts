// DeepSeek provider — OpenAI-compatible chat completions. (Temporary: per product
// decision this will be swapped for Gemini later; only this file + index.ts change.)
import type { LLMMessage, LLMCompleteOptions, LLMProvider } from "./types";

export class DeepSeekProvider implements LLMProvider {
  readonly name = "deepseek";
  readonly enabled = true;
  constructor(
    private apiKey: string,
    private model = "deepseek-chat"
  ) {}

  async complete(messages: LLMMessage[], opts: LLMCompleteOptions = {}): Promise<string> {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: opts.maxTokens ?? 500,
        temperature: opts.temperature ?? 0.4,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`DeepSeek ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return (data.choices?.[0]?.message?.content ?? "").trim();
  }
}
