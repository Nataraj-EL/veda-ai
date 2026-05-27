import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let redisClient: Redis | null = null;

function resolveRedisConnectionParts(): {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls?: Record<string, unknown>;
} {
  const url = env.REDIS_URL;
  if (url) {
    const parsed = new URL(url);
    const tlsFromUrl = parsed.protocol === "rediss:";
    const tls = env.REDIS_TLS || tlsFromUrl ? {} : undefined;

    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : env.REDIS_PORT,
      password: parsed.password || env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      tls,
    };
  }

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    tls: env.REDIS_TLS ? {} : undefined,
  };
}

export function createRedisConnection(label = "default"): Redis {
  const { host, port, password, db, tls } = resolveRedisConnectionParts();
  const connection = new Redis({
    host,
    port,
    password,
    db,
    tls,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  connection.on("connect", () => {
    logger.info({ label }, "Redis connected");
  });

  connection.on("error", (error: Error) => {
    logger.error({ err: error, label }, "Redis connection error");
  });

  return connection;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisConnection("shared");
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis disconnected gracefully");
  }
}

/** BullMQ requires duplicated connections for Queue and Worker */
export function getBullMqConnectionOptions(): {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: null;
  tls?: Record<string, unknown>;
} {
  const { host, port, password, db, tls } = resolveRedisConnectionParts();
  return {
    host,
    port,
    password,
    db,
    maxRetriesPerRequest: null,
    tls,
  };
}
