import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5100),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_NOTIFY_TOKEN: z.string().optional(),
  LINE_CHANNEL_ID: z.string().optional(),
  LINE_CHANNEL_SECRET: z.string().optional(),
  LINE_CALLBACK_URL: z.string().default("http://localhost:3000/line/callback"),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PDF_SECRET: z.string().optional(),
  APP_URL: z.string().default("http://localhost:5100"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  SESSION_SECRET: z.string().optional()
});

export const env = envSchema.parse(process.env);

export function getCorsOrigins() {
  return env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
}
