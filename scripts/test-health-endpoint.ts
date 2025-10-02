#!/usr/bin/env node
import "dotenv/config";
import { performance } from "node:perf_hooks";

// Simulate the health check logic
async function testHealthEndpoint() {
  console.log("🔍 Testing Redis health endpoint logic...\n");

  // Set a timeout for the entire test
  const timeout = setTimeout(() => {
    console.error("❌ Test timed out after 30 seconds");
    process.exit(1);
  }, 30000);

  try {
    console.log("📦 Importing modules...");

    // Lazy import to avoid errors during build time
    const { emailQueue } = await import("../src/lib/queues/emailQueue");
    const { getRedis } = await import("../src/lib/redis/connection");

    console.log("🔗 Connecting to Redis...");
    const redis = getRedis();

    // Set connection timeout
    redis.options.connectTimeout = 10000;

    const start = performance.now();
    console.log("🏓 Sending PING...");
    const pong = await redis.ping();
    const latencyMs = Math.round(performance.now() - start);

    console.log("📋 Getting queue counts...");
    const counts = await emailQueue.getJobCounts(
      "waiting",
      "active",
      "failed",
      "completed"
    );

    const ok = pong === "PONG";

    console.log("✅ Redis connection successful!");
    console.log(`📊 Latency: ${latencyMs}ms`);
    console.log(`🎯 PING response: ${pong}`);
    console.log("📋 Queue counts:", counts);
    console.log(`🏥 Status: ${ok ? "healthy" : "unhealthy"}`);

    // Simulate the response
    const response = {
      redis: ok ? "ok" : "down",
      latencyMs,
      bullmq: counts,
    };

    console.log("\n📤 Response:", JSON.stringify(response, null, 2));

    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }

    process.exit(1);
  }
}

testHealthEndpoint();
