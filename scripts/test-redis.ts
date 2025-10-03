#!/usr/bin/env node
import "dotenv/config";
import IORedis from "ioredis";
import { maskRedisUrl, sanitizeRedisError } from "../src/lib/logging";

console.log("🔍 Testing Redis connection...\n");

const redisUrl = process.env.REDIS_URL;
const redisTls = process.env.REDIS_TLS === "true";

if (!redisUrl) {
  console.error("❌ REDIS_URL is not defined in .env");
  process.exit(1);
}
const maskedUrl =
  maskRedisUrl(redisUrl) ?? redisUrl.replace(/:[^:@]+@/, ":***@");

console.log(`📡 Connecting to: ${maskedUrl}`);
console.log(`🔒 TLS enabled: ${redisTls}\n`);

const redis = new IORedis(redisUrl, {
  tls: redisTls ? {} : undefined,
  connectTimeout: 10000,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error("\n❌ Max connection attempts reached");
      return null;
    }
    console.log(`⏳ Retrying connection... (attempt ${times})`);
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => {
  console.log("✅ Connected to Redis successfully!\n");

  redis
    .ping()
    .then((result) => {
      console.log(`✅ PING test: ${result}`);
      console.log("\n🎉 Redis is working correctly!\n");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ PING failed:", error.message);
      process.exit(1);
    });
});

redis.on("error", (error) => {
  const sanitizedError = sanitizeRedisError(error);
  console.error("❌ Redis connection error:", sanitizedError);

  if (error.message.includes("ETIMEDOUT")) {
    console.log("\n💡 Suggestions:");
    console.log("   1. Check if Redis is running");
    console.log("   2. Verify firewall rules (Azure Redis)");
    console.log("   3. Check if your IP is whitelisted");
    console.log("   4. Try using local Redis for development\n");
    console.log("📖 See REDIS-SETUP.md for detailed instructions\n");
  }

  setTimeout(() => process.exit(1), 1000);
});

redis.on("close", () => {
  console.log("🔌 Connection closed");
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error("\n⏰ Connection timeout (15s)");
  console.log("💡 This usually means Redis is unreachable");
  console.log("📖 Check REDIS-SETUP.md for solutions\n");
  process.exit(1);
}, 15000);
