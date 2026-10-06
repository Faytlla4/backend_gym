import { config } from '../../config/index.js';
import { GeminiProvider } from './gemini.js';
import { MockAiProvider } from './mock.js';
import type { AiProvider } from './types.js';

let instance: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (instance) return instance;
  if (config.aiProviderApiKey) {
    instance = new GeminiProvider();
  } else {
    console.warn('[ai] No AI_PROVIDER_API_KEY set — using MockAiProvider');
    instance = new MockAiProvider();
  }
  return instance;
}
