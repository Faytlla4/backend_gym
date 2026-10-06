export interface CoachRequest {
  message: string;
  context: Record<string, unknown>;
}

export interface CoachResponse {
  reply: string;
}

export interface FoodItem {
  name: string;
  quantity: number;
  estimatedWeightGrams: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface FoodAnalysisResponse {
  items: FoodItem[];
}

export interface AiProvider {
  generateCoachResponse(request: CoachRequest): Promise<CoachResponse>;
  analyzeFoodImage(imageBase64: string, mimeType: string): Promise<FoodAnalysisResponse>;
}
