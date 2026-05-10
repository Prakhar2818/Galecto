"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = loggingMiddleware;
exports.responseLoggingMiddleware = responseLoggingMiddleware;
const logger_1 = require("../../../../packages/logger/src/logger");
async function loggingMiddleware(request, reply) {
    const context = request.context;
    logger_1.logger.info({
        requestId: context?.requestId,
        url: request.url,
        method: request.method,
    });
}
async function responseLoggingMiddleware(request, reply) {
    const context = request.context;
    const durationMs = context?.startTime ? Date.now() - context.startTime : undefined;
    logger_1.logger.info({
        requestId: context?.requestId,
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        durationMs,
    });
}
