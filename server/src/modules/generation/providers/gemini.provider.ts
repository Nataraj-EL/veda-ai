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
    userPrompt: string,
    files?: { buffer: Buffer; mimeType: string }[]
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);

    const parts: any[] = [userPrompt];
    if (files && files.length > 0) {
      for (const file of files) {
        parts.push({
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimeType,
          },
        });
      }
    }

    let activeModelName = this.model;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: activeModelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent(parts, {
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

        const isRateLimit = message.includes("429") || normalized.includes("too many requests");
        const isHighDemand503 =
          message.includes("[503") || normalized.includes("high demand") || normalized.includes("service unavailable");
        const isTimeout = normalized.includes("timeout") || normalized.includes("aborted");

        const isTransient = isRateLimit || isHighDemand503 || isTimeout;

        if (isTransient && attempt < maxAttempts) {
          if (activeModelName !== "gemini-flash-lite-latest") {
            logger.warn({ activeModelName }, "Switching to gemini-flash-lite-latest to bypass resource load constraints");
            activeModelName = "gemini-flash-lite-latest";
          }

          const backoffMs = 2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
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

