"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContextMiddleware = requestContextMiddleware;
const uuid_1 = require("uuid");
function getHeaderValue(request, key) {
    const value = request.headers[key];
    if (typeof value === "string" && value.trim())
        return value;
    if (Array.isArray(value) && value[0]?.trim())
        return value[0];
    return null;
}
async function requestContextMiddleware(request, reply) {
    const traceId = getHeaderValue(request, "x-trace-id") || (0, uuid_1.v4)();
    const spanId = (0, uuid_1.v4)(); // Gateway creates the first span
    request.headers["x-trace-id"] = traceId;
    request.headers["x-span-id"] = spanId;
    reply.header("x-trace-id", traceId);
    reply.header("x-span-id", spanId);
    request.context = {
        traceId,
        spanId,
        startTime: Date.now(),
    };
}
