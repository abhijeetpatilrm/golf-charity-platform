require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ALLOW_DEV_AUTH_BYPASS: z.string().optional(),
  ALLOW_DEV_SUBSCRIPTION_BYPASS: z.string().optional(),
  DEV_USER_ID: z.string().optional(),
  DEV_USER_EMAIL: z.string().optional(),
  DEV_USER_ROLE: z.string().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  CLIENT_ORIGIN: z.string().optional(),
  PRIZE_POOL_PER_SUBSCRIBER: z.string().optional(),
  DRAW_SCHEDULER_ENABLED: z.string().optional(),
  DRAW_SCHEDULER_HOUR_UTC: z.string().optional(),
  DRAW_SCHEDULER_MINUTE_UTC: z.string().optional(),
  DRAW_SCHEDULER_DEFAULT_TYPE: z.string().optional(),
  DRAW_SCHEDULER_DEFAULT_MODE: z.string().optional(),
  ERROR_TRACKING_WEBHOOK_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Environment validation failed: ${issues}`);
}

module.exports = parsed.data;
