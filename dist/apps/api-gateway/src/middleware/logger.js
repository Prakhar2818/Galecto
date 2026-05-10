"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = loggingMiddleware;
exports.responseLoggingMiddleware = responseLoggingMiddleware;
const logger_1 = require("../../../../packages/logger/src/logger");
const producer_1 = require("../../../../packages/kafka/src/producer");
const index_1 = require("../../../../packages/types/src/index");
const uuid_1 = require("uuid");
async function loggingMiddleware(request, reply) {
    const context = request.context;
    logger_1.logger.info({
        traceId: context?.traceId,
        spanId: context?.spanId,
        url: request.url,
        method: request.method,
    });
    const event = {
        eventId: (0, uuid_1.v4)(),
        traceId: context?.traceId || (0, uuid_1.v4)(),
        spanId: context?.spanId || (0, uuid_1.v4)(),
        type: index_1.EventType.TRACE,
        service: "api-gateway",
        name: `API_REQUEST ${request.method} ${request.url}`,
        timestamp: Date.now(),
        payload: {
            url: request.url,
            method: request.method,
            headers: request.headers,
            body: request.body
        },
    };
    (0, producer_1.sendEvent)("events", event).catch(err => logger_1.logger.error({ err }, "Failed to send Kafka event"));
}
async function responseLoggingMiddleware(request, reply) {
    const context = request.context;
    const durationMs = context?.startTime ? Date.now() - context.startTime : undefined;
    logger_1.logger.info({
        traceId: context?.traceId,
        spanId: context?.spanId,
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        durationMs,
    });
    const event = {
        eventId: (0, uuid_1.v4)(),
        traceId: context?.traceId || (0, uuid_1.v4)(),
        spanId: context?.spanId || (0, uuid_1.v4)(),
        type: index_1.EventType.TRACE,
        service: "api-gateway",
        name: `API_RESPONSE ${request.method} ${request.url}`,
        timestamp: Date.now(),
        payload: {
            url: request.url,
            method: request.method,
            statusCode: reply.statusCode,
            durationMs
        },
    };
    (0, producer_1.sendEvent)("events", event).catch(err => logger_1.logger.error({ err }, "Failed to send Kafka event"));
}
