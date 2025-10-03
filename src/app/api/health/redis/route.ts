export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { performance } from "node:perf_hooks";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  // Authentication: only authenticated users or internal requests can access
  const session = await getServerSession(authOptions);
  const apiKey = request.headers.get("x-api-key");
  const internalApiKey = process.env.INTERNAL_API_KEY;
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check if it's an authenticated request (logged in user OR valid internal API key)
  // In development, allow access without authentication for testing
  const isAuthorized =
    isDevelopment ||
    session ||
    (apiKey && internalApiKey && apiKey === internalApiKey);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Lazy import to avoid errors during build time
    const { emailQueue } = await import("@/lib/queues/emailQueue");
    const { getRedis } = await import("@/lib/redis/connection");

    const redis = getRedis();
    const start = performance.now();
    const pong = await redis.ping();
    const latencyMs = Math.round(performance.now() - start);

    const counts = await emailQueue.getJobCounts(
      "waiting",
      "active",
      "failed",
      "completed"
    );

    const ok = pong === "PONG";

    // Return limited information for non-admin users
    const isAdmin = session?.user?.email?.endsWith("@bossabyte.tech");

    if (!isAdmin && !apiKey) {
      return NextResponse.json(
        {
          status: ok ? "healthy" : "unhealthy",
        },
        { status: ok ? 200 : 500 }
      );
    }

    // Detailed information only for admins or internal requests
    return NextResponse.json(
      {
        redis: ok ? "ok" : "down",
        latencyMs,
        bullmq: counts,
      },
      { status: ok ? 200 : 500 }
    );
  } catch (error) {
    // Detailed internal log (server-side only)
    console.error(
      "[health/redis] Error:",
      error instanceof Error ? error.message : String(error)
    );

    // Generic response for the client
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Service temporarily unavailable",
      },
      { status: 500 }
    );
  }
}
