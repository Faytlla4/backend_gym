import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  aiProviderApiKey: process.env.AI_PROVIDER_API_KEY || '',
  aiProviderModel: process.env.AI_PROVIDER_MODEL || 'gemini-3-flash-preview',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8080')
    .split(',')
    .map((s) => s.trim()),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10),
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '25000', 10),
  maxCoachMessageLength: parseInt(process.env.MAX_COACH_MESSAGE_LENGTH || '500', 10),
  aiOutputLimit: parseInt(process.env.AI_OUTPUT_LIMIT || '500', 10),
};
