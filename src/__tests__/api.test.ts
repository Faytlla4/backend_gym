import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { config } from '../config/index.js';
import { errorResponse } from '../utils/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { coachRouter } from '../routes/coach.js';
import { foodRouter } from '../routes/food.js';
import { healthRouter } from '../routes/health.js';

function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/health', healthRouter);
  app.use('/coach', rateLimit(config.rateLimitMax, config.rateLimitWindowMs), coachRouter);
  app.use('/food/analyze', rateLimit(config.rateLimitMax, config.rateLimitWindowMs), foodRouter);
  // Mirror server.ts: structured JSON errors, never HTML or stack traces.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
    errorResponse(res, err),
  );
  return app;
}

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /coach', () => {
  it('rejects missing message', async () => {
    const res = await request(createApp()).post('/coach').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects non-string message', async () => {
    const res = await request(createApp()).post('/coach').send({ message: 123 });
    expect(res.status).toBe(400);
  });

  it('rejects oversized message', async () => {
    const res = await request(createApp())
      .post('/coach')
      .send({ message: 'x'.repeat(config.maxCoachMessageLength + 1) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MESSAGE_TOO_LONG');
  });

  it('rejects non-object context', async () => {
    const res = await request(createApp())
      .post('/coach')
      .send({ message: 'hi', context: 'bad' });
    expect(res.status).toBe(400);
  });

  it('accepts valid request (mock provider)', async () => {
    const res = await request(createApp())
      .post('/coach')
      .send({ message: 'How am I doing?', context: { streak: 7 } });
    expect(res.status).toBe(200);
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  });
});

describe('POST /food/analyze', () => {
  it('rejects missing image', async () => {
    const res = await request(createApp()).post('/food/analyze');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('IMAGE_REQUIRED');
  });

  it('accepts image and returns structured items (mock)', async () => {
    const res = await request(createApp())
      .post('/food/analyze')
      .attach('image', Buffer.from('fake-image-bytes'), 'food.jpg');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    const item = res.body.items[0];
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('estimatedWeightGrams');
    expect(item).toHaveProperty('confidence');
  });
});

describe('rate limiting', () => {
  it('blocks requests over the limit', async () => {
    const app = createApp();
    const max = config.rateLimitMax;
    for (let i = 0; i < max; i++) {
      await request(app).post('/coach').send({ message: 'hi', context: {} });
    }
    const res = await request(app).post('/coach').send({ message: 'hi', context: {} });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('security', () => {
  it('never returns API key in responses', async () => {
    const res = await request(createApp()).get('/health');
    const text = JSON.stringify(res.body);
    if (config.aiProviderApiKey) {
      expect(text).not.toContain(config.aiProviderApiKey);
    } else {
      // No key configured (mock mode) — assert no key-like fields leak.
      expect(text).not.toMatch(/api[_-]?key/i);
    }
  });

  it('returns structured errors without stack traces', async () => {
    const res = await request(createApp()).post('/coach').send({});
    expect(res.body).not.toHaveProperty('stack');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});
