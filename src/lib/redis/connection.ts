import IORedis, { RedisOptions } from 'ioredis';

import { sanitizeRedisError } from '@/lib/logging';

let redisClient: IORedis | null = null;

const INTERNAL_HOST_PATTERN = /\.(?:railway\.)?internal$/;

/**
 * Throws if the Redis URL is not secured appropriately for the environment.
 *
 * In production we accept a connection when any of the following is true:
 *   - the URL uses the `rediss://` scheme (TLS),
 *   - `REDIS_TLS=true` is set (TLS wrapped onto a `redis://` URL), or
 *   - the host is on a trusted internal private network (suffix `.internal`,
 *     which matches Railway's `*.railway.internal` service-to-service DNS).
 *
 * Development connections are always permitted.
 */
const ensureSecureRedis = (redisUrl: string): void => {
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  if (redisUrl.startsWith('rediss://')) {
    return;
  }
  if (process.env.REDIS_TLS === 'true') {
    return;
  }
  try {
    const { hostname } = new URL(redisUrl);
    if (INTERNAL_HOST_PATTERN.test(hostname)) {
      return;
    }
  } catch {
    // Fall through to the throw below if the URL fails to parse.
  }
  throw new Error(
    'Secure Redis (rediss://) is required outside development, unless connecting over an internal private network (*.internal) or with REDIS_TLS=true.'
  );
};

const buildOptions = (redisUrl: string): RedisOptions => {
  const isSecure = redisUrl.startsWith('rediss://');
  const explicitTls = process.env.REDIS_TLS === 'true';

  const options: RedisOptions = {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    connectTimeout: 10_000,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('[redis] Max connection retry attempts reached. Connection failed.');
        return null;
      }
      const delay = Math.min(times * 200, 2_000);
      console.log(`[redis] Retrying connection in ${delay}ms... (attempt ${times}/3)`);
      return delay;
    },
  };

  if (isSecure || explicitTls) {
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
    throw new Error('REDIS_URL environment variable is not defined.');
  }

  ensureSecureRedis(redisUrl);

  const options = buildOptions(redisUrl);
  redisClient = new IORedis(redisUrl, options);

  redisClient.on('connect', () => {
    console.info('[redis] Connection established');
  });

  redisClient.on('error', (error) => {
    const sanitizedError = sanitizeRedisError(error);
    console.error('[redis] Connection error:', sanitizedError);
  });

  redisClient.on('reconnecting', () => {
    console.warn('[redis] Reconnecting...');
  });

  return redisClient;
};

export const getBullConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not defined.');
  }

  ensureSecureRedis(redisUrl);

  const shouldUseTls = redisUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true';

  return {
    url: redisUrl,
    tls: shouldUseTls ? {} : undefined,
  } as const;
};
