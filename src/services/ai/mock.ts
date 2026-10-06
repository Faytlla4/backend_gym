import type { AiProvider, CoachRequest, CoachResponse, FoodAnalysisResponse } from './types.js';

export class MockAiProvider implements AiProvider {
  async generateCoachResponse(request: CoachRequest): Promise<CoachResponse> {
    return {
      reply: `Mock coach response to: "${request.message.slice(0, 80)}"`,
    };
  }

  async analyzeFoodImage(): Promise<FoodAnalysisResponse> {
    return {
      items: [
        { name: 'Egg', quantity: 2, estimatedWeightGrams: 100, confidence: 'high' },
        { name: 'White rice', quantity: 1, estimatedWeightGrams: 150, confidence: 'high' },
      ],
    };
  }
}
