"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, request, reply) {
    const context = request.context;
    const requestId = context?.requestId || request.headers["x-request-id"];
    reply.status(error.statusCode || 500).send({
        requestId,
        message: error.message || "Something went wrong",
    });
}
