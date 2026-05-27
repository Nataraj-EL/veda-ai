import { config } from "dotenv";
import { z } from "zod";

config();

// Backwards-compatible aliasing for local dev env files.
// Spec uses CLIENT_URL but existing code uses CLIENT_ORIGIN.
if (!process.env.CLIENT_ORIGIN && process.env.CLIENT_URL) {
  process.env.CLIENT_ORIGIN = process.env.CLIENT_URL;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  CLIENT_URL: z.string().url().optional(),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_URL: z.string().optional(),
  REDIS_TLS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  GENERATION_QUEUE_NAME: z.string().default("assessment-generation"),
  GENERATION_JOB_ATTEMPTS: z.coerce.number().int().positive().default(3),
  GENERATION_JOB_BACKOFF_MS: z.coerce.number().int().positive().default(5000),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  EMBED_WORKER: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment configuration:", formatted);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
