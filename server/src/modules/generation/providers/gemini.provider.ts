import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";

export interface GeminiProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export class GeminiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
  }

  async generate(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);

    // Gemini supports JSON-only responses via responseMimeType.
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await model.generateContent(userPrompt, {
          timeout: this.timeoutMs,
        });

        const text = result.response.text();
        if (!text) {
          throw new Error("Gemini returned empty response");
        }
        return text;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const normalized = message.toLowerCase();

        const isRateLimit = message.includes("429");
        const isHighDemand503 =
          message.includes("[503") || normalized.includes("high demand");
        const isTimeout = normalized.includes("timeout");

        const isTransient = isRateLimit || isHighDemand503 || isTimeout;

        if (isTransient && attempt < maxAttempts) {
          const backoffMs = 1200 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 300);
          logger.warn(
            { attempt, backoffMs, message },
            "Transient Gemini error; retrying"
          );
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        // Preserve queue semantics: worker will mark failed + emit websocket failure.
        if (isRateLimit) {
          throw new Error(`GEMINI_RATE_LIMIT: ${message}`);
        }
        if (isTimeout) {
          throw new Error(`GEMINI_TIMEOUT: ${message}`);
        }

        logger.error({ err, message }, "Gemini generation error");
        throw new Error(`GEMINI_API_ERROR: ${message}`);
      }
    }

    throw new Error("GEMINI_API_ERROR: unexpected retry exhaustion");
  }
}

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

