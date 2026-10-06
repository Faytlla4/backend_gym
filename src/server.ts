import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorResponse } from './utils/errors.js';
import { rateLimit } from './middleware/rateLimit.js';
import { coachRouter } from './routes/coach.js';
import { foodRouter } from './routes/food.js';
import { healthRouter } from './routes/health.js';

const app = express();

app.use(cors({ origin: config.allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRouter);
app.use('/coach', rateLimit(config.rateLimitMax, config.rateLimitWindowMs), coachRouter);
app.use('/food/analyze', rateLimit(config.rateLimitMax, config.rateLimitWindowMs), foodRouter);

app.use('/health', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    // ponytail: multer attaches `code` only on its own errors — narrow first.
    const multerCode =
      err instanceof Error && err.name === 'MulterError'
          ? (err as Error & { code?: unknown }).code
          : undefined;
    if (typeof multerCode === 'string') {
      const tooLarge = multerCode === 'LIMIT_FILE_SIZE';
      res.status(400).json({
        error: {
          code: tooLarge ? 'IMAGE_TOO_LARGE' : 'UPLOAD_ERROR',
          message: tooLarge
            ? `Image must be under ${Math.round(config.maxImageSize / 1024 / 1024)}MB.`
            : 'Failed to process upload.',
        },
      });
      return;
    }
    errorResponse(res, err);
  },
);

app.listen(config.port, () => {
  console.log(`[server] AI backend listening on :${config.port}`);
  console.log(`[server] CORS origins: ${config.allowedOrigins.join(', ')}`);
  console.log(`[server] Rate limit: ${config.rateLimitMax} req / ${config.rateLimitWindowMs}ms`);
});
