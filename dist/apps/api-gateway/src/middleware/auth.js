"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const client_1 = require("../../../../packages/redis/src/client");
const logger_1 = require("../../../../packages/logger/src/logger");
const axios_1 = __importDefault(require("axios"));
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4000";
async function authMiddleware(request, reply) {
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.status(401).send({ error: "Missing or invalid Authorization header" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        let organizationId = null;
        // Check if token is in Redis cache (API key)
        organizationId = await client_1.redis.get(`apikey:${token}`);
        // If not in Redis, verify against auth service
        if (!organizationId) {
            try {
                const response = await axios_1.default.post(`${AUTH_SERVICE_URL}/auth/verify-api-key`, { apiKey: token }, { timeout: 2000 });
                if (response.data?.organizationId) {
                    organizationId = response.data.organizationId;
                    // Cache in Redis for future requests (24 hour TTL)
                    await client_1.redis.set(`apikey:${token}`, organizationId, "EX", 86400);
                }
            }
            catch (authErr) {
                logger_1.logger.debug({ token: token.substring(0, 10) }, "API key not found in auth service");
            }
        }
        if (!organizationId) {
            reply.status(401).send({ error: "Invalid API Key" });
            return;
        }
        request.organizationId = organizationId;
        request.authType = "api-key";
    }
    catch (error) {
        logger_1.logger.error({ error }, "Failed to validate API key");
        reply.status(500).send({ error: "Internal Server Error" });
    }
}
