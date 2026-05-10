"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuthMiddleware = jwtAuthMiddleware;
async function jwtAuthMiddleware(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
    }
}
