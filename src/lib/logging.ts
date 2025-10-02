const REDIS_CREDENTIALS_REGEX = /redis[s]?:\/\/[^@]*@/gi;

export function sanitizeRedisError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(
      REDIS_CREDENTIALS_REGEX,
      "rediss://<credentials>@"
    );
  }

  if (typeof error === "string") {
    return error.replace(REDIS_CREDENTIALS_REGEX, "rediss://<credentials>@");
  }

  return "Unknown error";
}

export function maskRedisUrl(url: string | undefined | null): string {
  if (!url) {
    return "<undefined>";
  }
  return url.replace(REDIS_CREDENTIALS_REGEX, "rediss://<credentials>@");
}

export function summarizeJobPayload(payload: unknown): string {
  if (!payload) {
    return "payload=<empty>";
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    return "payload=<non-object>";
  }

  const keys = Object.keys(payload as Record<string, unknown>);
  if (keys.length === 0) {
    return "payload=<empty object>";
  }

  return `payloadKeys=${keys.join(",")}`;
}
