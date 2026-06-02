// LLM-generated written report summary. Uses the active LLM provider (DeepSeek now,
// Gemini later) and ALWAYS falls back to a deterministic template if no provider/error —
// so a report never lacks a summary. Only sends address + already-computed measurements.
import { getLLM } from "./llm";
import type { LLMMessage } from "./llm/types";

export interface SummaryInput {
  displayId: string;
  address: string;
  reportType: string;
  totalSqFt: number;
  squares: number;
  predominantPitch: string;
  lengths: { ridge: number; hip: number; valley: number; rake: number; eave: number };
  facetCount: number;
}

const r = (n: number) => Math.round(n);

/** Pure prompt builder (unit-testable). */
export function buildSummaryPrompt(d: SummaryInput): LLMMessage[] {
  return [
    {
      role: "system",
      content:
        "You write concise, factual summaries for professional roof-measurement reports used by " +
        "roofing contractors and insurance adjusters. 2–3 sentences. Use only the numbers given — " +
        "never invent figures. Neutral, professional tone. No markdown.",
    },
    {
      role: "user",
      content:
        `Write a summary for report ${d.displayId} at ${d.address} (${d.reportType}). ` +
        `Total roof area ${r(d.totalSqFt)} sq ft (${d.squares.toFixed(1)} squares), ` +
        `predominant pitch ${d.predominantPitch}, ${d.facetCount} facets. Line lengths (ft): ` +
        `ridge ${r(d.lengths.ridge)}, hip ${r(d.lengths.hip)}, valley ${r(d.lengths.valley)}, ` +
        `rake ${r(d.lengths.rake)}, eave ${r(d.lengths.eave)}.`,
    },
  ];
}

/** Deterministic fallback summary (no LLM). */
export function fallbackSummary(d: SummaryInput): string {
  return (
    `Roof report ${d.displayId} for ${d.address}: approximately ${r(d.totalSqFt)} sq ft ` +
    `(${d.squares.toFixed(1)} roofing squares) across ${d.facetCount} facet(s), with a predominant ` +
    `pitch of ${d.predominantPitch}. Line totals — ridge ${r(d.lengths.ridge)} ft, hip ${r(d.lengths.hip)} ft, ` +
    `valley ${r(d.lengths.valley)} ft, rake ${r(d.lengths.rake)} ft, eave ${r(d.lengths.eave)} ft.`
  );
}

/** Generate a summary via the LLM, falling back to the template on disabled/error. */
export async function generateReportSummary(
  input: SummaryInput
): Promise<{ text: string; source: string }> {
  const llm = getLLM();
  if (!llm.enabled) return { text: fallbackSummary(input), source: "template" };
  try {
    const text = await llm.complete(buildSummaryPrompt(input), { maxTokens: 320, temperature: 0.3 });
    return text
      ? { text, source: llm.name }
      : { text: fallbackSummary(input), source: "template" };
  } catch {
    return { text: fallbackSummary(input), source: "template-fallback" };
  }
}
