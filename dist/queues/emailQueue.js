"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueue = exports.getEmailQueue = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("@/lib/redis/connection");
let emailQueueInstance = null;
const getEmailQueue = () => {
    if (!emailQueueInstance) {
        emailQueueInstance = new bullmq_1.Queue("email", {
            connection: (0, connection_1.getBullConnection)(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: true,
            },
        });
    }
    return emailQueueInstance;
};
exports.getEmailQueue = getEmailQueue;
// For compatibility with existing code
exports.emailQueue = new Proxy({}, {
    get(target, prop) {
        return (0, exports.getEmailQueue)()[prop];
    },
});
