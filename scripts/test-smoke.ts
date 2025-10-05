#!/usr/bin/env node
import "dotenv/config";
import { performance } from "node:perf_hooks";

type SmokeStep = {
  name: string;
  path: string;
  method?: string;
  expectedStatus?: number;
  expectJson?: boolean;
  timeoutMs?: number;
  assert?: (context: {
    response: Response;
    body: string;
    data?: unknown;
    url: string;
  }) => Promise<void> | void;
};

const DEFAULT_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 10000);

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runStep(baseUrl: URL, step: SmokeStep) {
  const url = new URL(step.path, baseUrl).toString();
  const expectedStatus = step.expectedStatus ?? 200;
  const timeoutMs = step.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const start = performance.now();
  const response = await fetchWithTimeout(
    url,
    {
      method: step.method ?? "GET",
      headers: {
        accept: step.expectJson
          ? "application/json"
          : "text/html,application/json",
      },
    },
    timeoutMs
  );
  const elapsed = Math.round(performance.now() - start);

  if (response.status !== expectedStatus) {
    throw new Error(
      `${step.name}: expected status ${expectedStatus} but received ${response.status}`
    );
  }

  const body = await response.text();
  const data = step.expectJson ? JSON.parse(body) : undefined;

  if (step.assert) {
    await step.assert({ response, body, data, url });
  }

  console.log(`✅ ${step.name} (${elapsed}ms)`);
}

async function main() {
  const baseInput = process.env.SMOKE_BASE_URL ?? process.argv[2];

  if (!baseInput) {
    console.error(
      "❌ Missing target. Provide SMOKE_BASE_URL environment variable or pass the base URL as an argument."
    );
    console.error(
      "   Example: SMOKE_BASE_URL=https://app.example.com npm run test:smoke"
    );
    process.exit(1);
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(baseInput);
  } catch (error) {
    console.error(`❌ Invalid base URL: ${baseInput}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
    return; // for type narrowing
  }

  const steps: SmokeStep[] = [
    {
      name: "Home page",
      path: "/",
      assert: ({ body }) => {
        if (!body.toLowerCase().includes("repurpose")) {
          throw new Error(
            "Home page did not contain expected copy (" + "repurpose" + ")"
          );
        }
      },
    },
    {
      name: "Login page",
      path: "/login",
      assert: ({ body }) => {
        if (!body.includes("Welcome Back")) {
          throw new Error("Login page missing 'Welcome Back' heading");
        }
      },
    },
    {
      name: "Redis health API",
      path: "/api/health/redis",
      expectJson: true,
      assert: ({ data }) => {
        if (!data || typeof data !== "object") {
          throw new Error("Health endpoint did not return JSON object");
        }
        const redisStatus = (data as Record<string, unknown>).redis;
        if (redisStatus !== "ok") {
          throw new Error(`Redis health check reported status: ${redisStatus}`);
        }
      },
    },
  ];

  console.log(`🚀 Running smoke tests against ${baseUrl.toString()}`);

  let failures = 0;

  for (const step of steps) {
    try {
      await runStep(baseUrl, step);
    } catch (error) {
      failures += 1;
      console.error(`❌ ${step.name} failed`);
      if (error instanceof Error) {
        console.error(`   → ${error.message}`);
      } else {
        console.error(`   → ${String(error)}`);
      }
    }
  }

  if (failures > 0) {
    console.error(`
❌ Smoke tests failed (${failures}/${steps.length})`);
    process.exit(1);
  }

  console.log(`
🎉 Smoke test suite passed (${steps.length}/${steps.length})`);
}

main().catch((error) => {
  console.error("❌ Unexpected error during smoke tests:", error);
  process.exit(1);
});
