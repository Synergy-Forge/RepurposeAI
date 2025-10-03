import IORedis, { RedisOptions } from "ioredis";

import { sanitizeRedisError } from "@/lib/logging";

let redisClient: IORedis | null = null;

const buildOptions = (): RedisOptions => {
  const tlsEnabled = process.env.REDIS_TLS === "true";
  const options: RedisOptions = {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    connectTimeout: 10000, // 10 seconds
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error(
          "[redis] Max connection retry attempts reached. Connection failed."
        );
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 2000);
      console.log(
        `[redis] Retrying connection in ${delay}ms... (attempt ${times}/3)`
      );
      return delay;
    },
  };

  if (tlsEnabled) {
    options.tls = {};
  }

  return options;
};

export const getRedis = (): IORedis => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not defined.");
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment) {
    if (!redisUrl.startsWith("rediss://")) {
      throw new Error(
        "Secure Redis (rediss://) is required outside development."
      );
    }
    if (process.env.REDIS_TLS !== "true") {
      throw new Error(
        "REDIS_TLS must be set to 'true' when running outside development."
      );
    }
  }

  const options = buildOptions();
  redisClient = new IORedis(redisUrl, options);

  redisClient.on("connect", () => {
    console.info("[redis] Connection established");
  });

  redisClient.on("error", (error) => {
    const sanitizedError = sanitizeRedisError(error);
    console.error("[redis] Connection error:", sanitizedError);
  });

  redisClient.on("reconnecting", () => {
    console.warn("[redis] Reconnecting...");
  });

  return redisClient;
};

export const getBullConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is not defined.");
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment && !redisUrl.startsWith("rediss://")) {
    throw new Error(
      "Secure Redis (rediss://) is required outside development."
    );
  }

  if (!isDevelopment && process.env.REDIS_TLS !== "true") {
    throw new Error(
      "REDIS_TLS must be 'true' when running outside development."
    );
  }

  return {
    url: redisUrl,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  } as const;
};
