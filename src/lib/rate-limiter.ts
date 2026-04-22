import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { getRedis } from '@/lib/redis/connection';

let _registerLimiter: RateLimiterRedis | null = null;
let _loginLimiter: RateLimiterRedis | null = null;

function getRegisterLimiter(): RateLimiterRedis {
  if (!_registerLimiter) {
    _registerLimiter = new RateLimiterRedis({
      storeClient: getRedis(),
      keyPrefix: 'rl:register',
      points: 5,
      duration: 900,      // 15 minutes
      blockDuration: 900,
    });
  }
  return _registerLimiter;
}

function getLoginLimiter(): RateLimiterRedis {
  if (!_loginLimiter) {
    _loginLimiter = new RateLimiterRedis({
      storeClient: getRedis(),
      keyPrefix: 'rl:login',
      points: 10,
      duration: 900,      // 15 minutes
      blockDuration: 900,
    });
  }
  return _loginLimiter;
}

/**
 * Consumes one point for the given key against the registration rate limit.
 * Returns true if the request is allowed, false if it should be blocked.
 * Fails open (returns true) if Redis is unavailable.
 */
export async function checkRegisterRateLimit(key: string): Promise<boolean> {
  try {
    await getRegisterLimiter().consume(key);
    return true;
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return false;
    }
    // Redis unavailable — fail open to avoid blocking legitimate registrations
    console.error('[rate-limiter] Register limiter error (failing open):', error);
    return true;
  }
}

/**
 * Consumes one point for the given key against the login rate limit.
 * Returns true if the request is allowed, false if it should be blocked.
 * Fails open (returns true) if Redis is unavailable.
 */
export async function checkLoginRateLimit(key: string): Promise<boolean> {
  try {
    await getLoginLimiter().consume(key);
    return true;
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return false;
    }
    // Redis unavailable — fail open to avoid locking out users
    console.error('[rate-limiter] Login limiter error (failing open):', error);
    return true;
  }
}
