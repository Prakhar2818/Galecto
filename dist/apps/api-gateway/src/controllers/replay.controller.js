"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayController = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../../../../packages/clickhouse/src/client");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const logger_1 = require("../../../../packages/logger/src/logger");
const replay_protection_1 = require("../services/replay-protection");
const prisma = new client_1.PrismaClient();
class ReplayController {
    async executeReplay(req, reply) {
        const { traceId } = req.params;
        const user = req.user;
        const organizationId = user?.organizationId;
        if (!organizationId) {
            return reply.status(401).send({ error: "Organization context required" });
        }
        try {
            const result = await client_2.clickhouse.query({
                query: `
          SELECT payload 
          FROM events 
          WHERE trace_id = {traceId: String} AND event_name LIKE 'API_REQUEST%'
          LIMIT 1
        `,
                query_params: { traceId },
                format: 'JSONEachRow',
            });
            const row = await result.json();
            if (!row || row.length === 0) {
                return reply.status(404).send({ error: "Original request metadata not found" });
            }
            const originalPayload = JSON.parse(row[0].payload);
            let { method, url, headers, body } = originalPayload;
            const urlValidation = replay_protection_1.replayProtection.validateTargetUrl(url);
            if (!urlValidation.valid) {
                return reply.status(400).send({ error: urlValidation.error });
            }
            headers = replay_protection_1.replayProtection.filterHeaders(headers);
            body = replay_protection_1.replayProtection.maskPii(body);
            body = replay_protection_1.replayProtection.redactSensitiveFields(body);
            const replayExecution = await prisma.replayExecution.create({
                data: {
                    traceId,
                    organizationId,
                    status: 'RUNNING',
                    requestMethod: method,
                    requestUrl: url,
                    requestHeaders: JSON.stringify(headers),
                    requestBody: body ? JSON.stringify(body) : null,
                }
            });
            const replayTraceId = `replay_${(0, uuid_1.v4)()}`;
            logger_1.logger.info({
                originalTraceId: traceId,
                replayTraceId,
                replayId: replayExecution.id,
                message: "Executing protected shadow replay"
            });
            try {
                const response = await (0, axios_1.default)({
                    method,
                    url: `http://localhost:3001${url}`,
                    data: body,
                    headers: {
                        ...headers,
                        'x-trace-id': replayTraceId,
                        'x-original-trace-id': traceId,
                        'x-galecto-replay': 'true'
                    },
                    validateStatus: () => true
                });
                const maskedResponse = replay_protection_1.replayProtection.maskPii(response.data);
                await prisma.replayExecution.update({
                    where: { id: replayExecution.id },
                    data: {
                        status: 'COMPLETED',
                        responseStatus: response.status,
                        responseBody: JSON.stringify(maskedResponse),
                        completedAt: new Date()
                    }
                });
                return reply.send({
                    success: true,
                    replayId: replayExecution.id,
                    replayTraceId,
                    originalTraceId: traceId,
                    statusCode: response.status
                });
            }
            catch (axiosError) {
                await prisma.replayExecution.update({
                    where: { id: replayExecution.id },
                    data: {
                        status: 'FAILED',
                        errorMessage: axiosError.message,
                        completedAt: new Date()
                    }
                });
                return reply.status(500).send({
                    error: "Failed to re-fire request",
                    details: axiosError.message
                });
            }
        }
        catch (error) {
            logger_1.logger.error({ error }, "Replay execution failed");
            return reply.status(500).send({ error: "Internal server error during replay" });
        }
    }
    async listReplays(req, reply) {
        const user = req.user;
        const organizationId = user?.organizationId;
        if (!organizationId) {
            return reply.status(401).send({ error: "Organization context required" });
        }
        const replays = await prisma.replayExecution.findMany({
            where: { organizationId },
            orderBy: { executedAt: 'desc' },
            take: 50
        });
        return { success: true, data: replays };
    }
}
exports.ReplayController = ReplayController;
