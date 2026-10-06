import { Router } from 'express';
import multer from 'multer';
import { config } from '../config/index.js';
import { ApiError } from '../utils/errors.js';
import { getAiProvider } from '../services/ai/index.js';
import { LocalNutritionProvider, calculateNutrition } from '../services/nutrition/provider.js';

const nutrition = new LocalNutritionProvider();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxImageSize, files: 1 },
});

export const foodRouter = Router();

foodRouter.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'IMAGE_REQUIRED', 'An image file is required.');
    }
    const provider = getAiProvider();
    const analysis = await provider.analyzeFoodImage(
      req.file.buffer.toString('base64'),
      req.file.mimetype,
    );
    // Deterministic nutrition calculation — never from LLM.
    const items = analysis.items.map((item) => {
      const per100 = nutrition.lookupFood(item.name);
      const nutritionEstimate = per100
        ? calculateNutrition(per100, item.estimatedWeightGrams)
        : null;
      return { ...item, nutritionEstimate };
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
