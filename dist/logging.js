"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRedisError = sanitizeRedisError;
exports.maskRedisUrl = maskRedisUrl;
exports.summarizeJobPayload = summarizeJobPayload;
const REDIS_CREDENTIALS_REGEX = /redis[s]?:\/\/[^@]*@/gi;
function sanitizeRedisError(error) {
    if (error instanceof Error) {
        return error.message.replace(REDIS_CREDENTIALS_REGEX, "rediss://<credentials>@");
    }
    if (typeof error === "string") {
        return error.replace(REDIS_CREDENTIALS_REGEX, "rediss://<credentials>@");
    }
    return "Unknown error";
}
function maskRedisUrl(url) {
    if (!url) {
        return "<undefined>";
    }
    return url.replace(REDIS_CREDENTIALS_REGEX, "rediss://<credentials>@");
}
function summarizeJobPayload(payload) {
    if (!payload) {
        return "payload=<empty>";
    }
    if (typeof payload !== "object" || Array.isArray(payload)) {
        return "payload=<non-object>";
    }
    const keys = Object.keys(payload);
    if (keys.length === 0) {
        return "payload=<empty object>";
    }
    return `payloadKeys=${keys.join(",")}`;
}
