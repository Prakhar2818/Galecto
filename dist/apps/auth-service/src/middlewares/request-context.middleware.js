"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContextMiddleware = requestContextMiddleware;
const crypto_1 = require("crypto");
function getRequestId(request) {
    const headerValue = request.headers["x-request-id"];
    if (typeof headerValue === "string" && headerValue.trim()) {
        return headerValue;
    }
    if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
        return headerValue[0];
    }
    return (0, crypto_1.randomUUID)();
}
async function requestContextMiddleware(request, reply) {
    const requestId = getRequestId(request);
    request.headers["x-request-id"] = requestId;
    reply.header("x-request-id", requestId);
    request.context = {
        requestId,
        startTime: Date.now(),
    };
}
