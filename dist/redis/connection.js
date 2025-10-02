"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBullConnection = exports.getRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logging_1 = require("@/lib/logging");
let redisClient = null;
const buildOptions = () => {
    const tlsEnabled = process.env.REDIS_TLS === "true";
    const options = {
        lazyConnect: false,
        maxRetriesPerRequest: null,
    };
    if (tlsEnabled) {
        options.tls = {};
    }
    return options;
};
const getRedis = () => {
    if (redisClient) {
        return redisClient;
    }
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL environment variable is not defined.");
    }
    const isDevelopment = process.env.NODE_ENV === "development";
    if (!isDevelopment) {
        if (!redisUrl.startsWith("rediss://")) {
            throw new Error("Secure Redis (rediss://) is required outside development.");
        }
        if (process.env.REDIS_TLS !== "true") {
            throw new Error("REDIS_TLS must be set to 'true' when running outside development.");
        }
    }
    const options = buildOptions();
    redisClient = new ioredis_1.default(redisUrl, options);
    redisClient.on("connect", () => {
        console.info("[redis] Connection established");
    });
    redisClient.on("error", (error) => {
        const sanitizedError = (0, logging_1.sanitizeRedisError)(error);
        console.error("[redis] Connection error:", sanitizedError);
    });
    redisClient.on("reconnecting", () => {
        console.warn("[redis] Reconnecting...");
    });
    return redisClient;
};
exports.getRedis = getRedis;
const getBullConnection = () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL environment variable is not defined.");
    }
    const isDevelopment = process.env.NODE_ENV === "development";
    if (!isDevelopment && !redisUrl.startsWith("rediss://")) {
        throw new Error("Secure Redis (rediss://) is required outside development.");
    }
    if (!isDevelopment && process.env.REDIS_TLS !== "true") {
        throw new Error("REDIS_TLS must be 'true' when running outside development.");
    }
    return {
        url: redisUrl,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    };
};
exports.getBullConnection = getBullConnection;
