"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmailWorker = void 0;
require("dotenv/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const logging_1 = require("@/lib/logging");
const connection_1 = require("@/lib/redis/connection");
const startEmailWorker = () => {
    console.log("[email-worker] Starting worker...");
    const connection = (0, connection_1.getBullConnection)();
    // Create a test Redis connection to verify connectivity and trigger connection logs
    const redisClient = new ioredis_1.default(connection.url, {
        tls: connection.tls,
        maxRetriesPerRequest: null,
        connectTimeout: 10000, // 10 seconds timeout
        retryStrategy: (times) => {
            if (times > 3) {
                console.error("[redis] Max connection attempts reached. Please check your Redis configuration.");
                return null; // Stop retrying
            }
            const delay = Math.min(times * 200, 2000);
            console.log(`[redis] Retrying connection in ${delay}ms... (attempt ${times})`);
            return delay;
        },
    });
    redisClient.on("connect", () => {
        console.info("[redis] Connection established");
    });
    redisClient.on("error", (error) => {
        const sanitizedError = (0, logging_1.sanitizeRedisError)(error);
        console.error("[redis] Connection error:", sanitizedError);
    });
    const queueEvents = new bullmq_1.QueueEvents("email", { connection });
    const worker = new bullmq_1.Worker("email", async (job) => {
        console.log(`[email-worker] Processing job ${job.id} - ${(0, logging_1.summarizeJobPayload)(job.data)}`);
    }, {
        connection,
    });
    worker.on("ready", () => {
        console.log("[email-worker] Worker started");
    });
    worker.on("completed", (job) => {
        console.log(`[email-worker] Job ${job.id} completed`);
    });
    worker.on("failed", (job, error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[email-worker] Job ${job?.id ?? "unknown"} failed: ${message}`);
    });
    worker.on("error", (error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[email-worker] Worker error", message);
    });
    queueEvents.on("completed", ({ jobId }) => {
        console.log(`[email-worker] Queue event completed for job ${jobId}`);
    });
    queueEvents.on("failed", ({ jobId, failedReason }) => {
        console.error(`[email-worker] Queue event failed for job ${jobId}: ${failedReason}`);
    });
    queueEvents.on("error", (error) => {
        console.error("[email-worker] Queue events error", error);
    });
    return worker;
};
exports.startEmailWorker = startEmailWorker;
if (typeof require !== "undefined" && require.main === module) {
    (0, exports.startEmailWorker)();
}
