import { Router } from 'express';
import { config } from '../config/index.js';
import { ApiError } from '../utils/errors.js';
import { getAiProvider } from '../services/ai/index.js';
import { LocalNutritionProvider, calculateNutrition } from '../services/nutrition/provider.js';

const nutrition = new LocalNutritionProvider();

export const coachRouter = Router();

coachRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body as { message?: unknown; context?: unknown };
    if (typeof body.message !== 'string' || body.message.trim().length === 0) {
      throw new ApiError(400, 'INVALID_REQUEST', 'message is required and must be a string.');
    }
    if (body.message.length > config.maxCoachMessageLength) {
      throw new ApiError(400, 'MESSAGE_TOO_LONG', `Message must be under ${config.maxCoachMessageLength} characters.`);
    }
    if (typeof body.context !== 'object' || body.context === null || Array.isArray(body.context)) {
      throw new ApiError(400, 'INVALID_REQUEST', 'context must be an object.');
    }
    const contextStr = JSON.stringify(body.context);
    if (contextStr.length > 4000) {
      throw new ApiError(400, 'CONTEXT_TOO_LARGE', 'Context payload is too large.');
    }
    const provider = getAiProvider();
    const response = await provider.generateCoachResponse({
      message: body.message.trim(),
      context: body.context as Record<string, unknown>,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});
