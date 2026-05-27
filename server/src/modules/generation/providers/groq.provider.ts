import { logger } from "../../../utils/logger.js";

export interface GroqProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export class GroqProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: GroqProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
  }

  async generate(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let timer: NodeJS.Timeout | null = null;
      const controller = new AbortController();

      // Configure individual request timeout
      timer = setTimeout(() => {
        controller.abort();
      }, this.timeoutMs);

      try {
        logger.info(
          { model: this.model, attempt, timeoutMs: this.timeoutMs },
          "Sending request to Groq API"
        );

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            temperature: 0.2, // Low temperature for high deterministic accuracy
            response_format: { type: "json_object" }, // Enforce JSON object response
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        if (timer) clearTimeout(timer);

        if (!response.ok) {
          const errorText = await response.text();
          const status = response.status;
          logger.error(
            { status, errorText, attempt },
            "Groq API error response"
          );

          const isRateLimit = status === 429;
          const isTransient = isRateLimit || status === 502 || status === 503 || status === 504;

          if (isTransient && attempt < maxAttempts) {
            const backoffMs = 1500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
            logger.warn(
              { attempt, backoffMs, status },
              "Transient Groq error; retrying after backoff"
            );
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }

          throw new Error(`GROQ_API_ERROR (${status}): ${errorText}`);
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Groq returned an empty choice content");
        }

        return content;
      } catch (err: unknown) {
        if (timer) clearTimeout(timer);

        const isAbort = err instanceof Error && err.name === "AbortError";
        const message = isAbort ? "Request timed out" : (err instanceof Error ? err.message : String(err));
        
        logger.error({ err, attempt }, `Error during Groq API attempt: ${message}`);

        if ((isAbort || message.includes("timeout")) && attempt < maxAttempts) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1);
          logger.warn({ attempt, backoffMs }, "Timeout occurred; retrying");
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        if (isAbort) {
          throw new Error(`GROQ_TIMEOUT: Groq request timed out after ${this.timeoutMs}ms`);
        }

        throw new Error(`GROQ_API_ERROR: ${message}`);
      }
    }

    throw new Error("GROQ_API_ERROR: Unexpected retry exhaustion");
  }
}
