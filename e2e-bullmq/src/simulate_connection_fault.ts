import { pathToFileURL } from "node:url";
import { Redis } from "ioredis";
import { getRedisConnection, pingLatency } from "./config.js";

const timestamp = () => new Date().toISOString();

function parseArgs(argv: string[]): { badUrl?: string } {
  const result: { badUrl?: string } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--bad-url") {
      result.badUrl = argv[index + 1];
      index += 1;
    }
  }
  return result;
}

function deriveInvalidUrl(current?: string): string {
  if (!current) {
    return "redis://:invalid@localhost:0";
  }
  try {
    const url = new URL(current);
    url.hostname = "invalid-host";
    url.port = url.port || "6379";
    return url.toString();
  } catch {
    return "redis://:invalid@localhost:0";
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

export async function simulateConnectionFault(badUrl?: string): Promise<void> {
  const faultyUrl = badUrl ?? deriveInvalidUrl(process.env.REDIS_URL);
  console.log(
    `[${timestamp()}] Tentando conectar com URL inválida: ${faultyUrl}`
  );

  let faultyClient: Redis | null = null;
  try {
    faultyClient = getRedisConnection(faultyUrl);
    await faultyClient.ping();
    console.error(
      `[${timestamp()}] Conexão inesperadamente bem-sucedida com URL inválida.`
    );
  } catch (error) {
    console.error(
      `[${timestamp()}] Erro esperado ao conectar com URL inválida: ${errorMessage(error)}`
    );
  } finally {
    if (faultyClient) {
      faultyClient.disconnect();
    }
  }

  console.log(`[${timestamp()}] Tentando novamente com REDIS_URL válido...`);
  const redis = getRedisConnection();
  try {
    const latency = await pingLatency(redis);
    console.log(
      `[${timestamp()}] Conexão válida estabelecida. PING ${latency.toFixed(2)} ms.`
    );
  } finally {
    try {
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  }
}

const isExecutedDirectly = () => {
  if (!process.argv[1]) {
    return false;
  }
  const entryHref = pathToFileURL(process.argv[1]).href;
  return import.meta.url === entryHref;
};

if (isExecutedDirectly()) {
  const { badUrl } = parseArgs(process.argv.slice(2));
  simulateConnectionFault(badUrl).catch((error) => {
    console.error(
      `[${timestamp()}] Erro não tratado na simulação: ${errorMessage(error)}`
    );
    process.exitCode = 1;
  });
}
