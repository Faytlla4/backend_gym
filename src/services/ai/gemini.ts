import { config } from '../../config/index.js';
import type { AiProvider, CoachRequest, CoachResponse, FoodAnalysisResponse, FoodItem } from './types.js';

const SYSTEM_PROMPT = `You are Coach, an athletic training companion inside the 100-Day Evolution app.
Reply in the same language the user writes in.
Keep replies to 1-3 short sentences.
Base every number on the USER DATA context provided; never invent workouts, meals, streaks, or XP.
The avatar is cosmetic only and never reflects the user body — never comment on bodies or ideal physiques.
General fitness info only: no medical diagnosis, no injury advice beyond rest and seeing a professional.
Be direct and encouraging.`;

export class GeminiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.apiKey = config.aiProviderApiKey;
    this.model = config.aiProviderModel;
  }

  private async callGemini(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.apiKey) {
      throw new Error('AI_PROVIDER_NOT_CONFIGURED');
    }
    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`AI_PROVIDER_HTTP_${res.status}`);
      }
      return (await res.json()) as Record<string, unknown>;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateCoachResponse(request: CoachRequest): Promise<CoachResponse> {
    const contextJson = JSON.stringify(request.context);
    const body = {
      system_instruction: {
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUSER DATA: ${contextJson}` }],
      },
      contents: [{ role: 'user', parts: [{ text: request.message }] }],
      generationConfig: { maxOutputTokens: config.aiOutputLimit, temperature: 0.7 },
    };
    const data = await this.callGemini(body);
    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const text = candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('AI_PROVIDER_EMPTY_RESPONSE');
    return { reply: text.slice(0, config.aiOutputLimit) };
  }

  async analyzeFoodImage(imageBase64: string, mimeType: string): Promise<FoodAnalysisResponse> {
    const prompt = `Analyze this food photo. Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{"items":[{"name":"Food name","quantity":1,"estimatedWeightGrams":150,"confidence":"high|medium|low"}]}
Rules: 1-6 items. Use common food names. Estimate portion weight in grams.
Confidence: high = clearly identifiable, medium = likely, low = uncertain.
Never invent exact nutrition — weight estimates only.`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: config.aiOutputLimit, temperature: 0.3 },
    };
    const data = await this.callGemini(body);
    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const raw = candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('AI_PROVIDER_MALFORMED_RESPONSE');
    }
    return normalizeFoodResponse(parsed);
  }
}

export function normalizeFoodResponse(raw: unknown): FoodAnalysisResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('AI_PROVIDER_MALFORMED_RESPONSE');
  }
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    throw new Error('AI_PROVIDER_MALFORMED_RESPONSE');
  }
  const valid: FoodItem[] = [];
  for (const item of items.slice(0, 6)) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    if (typeof o.name !== 'string' || o.name.trim().length === 0) continue;
    valid.push({
      name: o.name.trim(),
      quantity: typeof o.quantity === 'number' && o.quantity > 0 ? Math.round(o.quantity) : 1,
      estimatedWeightGrams:
        typeof o.estimatedWeightGrams === 'number' && o.estimatedWeightGrams > 0
          ? Math.round(o.estimatedWeightGrams)
          : 100,
      confidence: o.confidence === 'high' || o.confidence === 'medium' ? o.confidence : 'low',
    });
  }
  if (valid.length === 0) {
    throw new Error('AI_PROVIDER_EMPTY_RESPONSE');
  }
  return { items: valid };
}
