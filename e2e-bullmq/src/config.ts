import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { Redis } from "ioredis";

const ENV_LOCAL_FILENAME = ".env.local";

let envLoaded = false;

function loadEnvLocal(): void {
  if (envLoaded) {
    return;
  }

  const envPath = resolve(process.cwd(), ENV_LOCAL_FILENAME);
  if (!existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const raw = readFileSync(envPath, "utf8");
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .forEach((line) => {
      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) {
        return;
      }

      const key = line.slice(0, equalsIndex).trim();
      if (!key) {
        return;
      }

      const valueRaw = line.slice(equalsIndex + 1).trim();
      const value = valueRaw.replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    });

  envLoaded = true;
}

loadEnvLocal();

function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export interface RuntimeParams {
  queueName: string;
  jobs: number;
  failRate: number;
  concurrency: number;
  retries: number;
  backoffInitialMs: number;
}

const defaults: RuntimeParams = {
  queueName: toString(process.env.QUEUE_NAME, "repurposeai:e2e"),
  jobs: toNumber(process.env.JOBS, 100),
  failRate: Number(process.env.FAIL_RATE ?? 0.1),
  concurrency: toNumber(process.env.CONCURRENCY, 1),
  retries: toNumber(process.env.RETRIES, 3),
  backoffInitialMs: toNumber(process.env.BACKOFF_INITIAL_MS, 5000),
};

export function getRuntimeParams(): RuntimeParams {
  return { ...defaults };
}

export function getRedisConnection(overrideUrl?: string): Redis {
  const redisUrl = overrideUrl ?? process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error(
      "REDIS_URL não definido. Configure em .env.local ou variável de ambiente."
    );
  }

  const url = new URL(redisUrl);
  if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
    throw new Error(`Protocolo não suportado em REDIS_URL: ${url.protocol}`);
  }

  const useTls = url.protocol === "rediss:";

  return new Redis(redisUrl, {
    tls: useTls ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export async function pingLatency(redis: Redis): Promise<number> {
  const start = performance.now();
  await redis.ping();
  const end = performance.now();
  return end - start;
}
