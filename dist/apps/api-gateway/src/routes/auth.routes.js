"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const authClient_1 = require("../services/authClient");
async function authRoutes(app) {
    const authClient = new authClient_1.AuthClient();
    app.post("/api/v1/auth/signup", async (req, reply) => {
        const data = req.body;
        const headers = req.headers;
        const res = await authClient.register(data, headers);
        return reply.send(res);
    });
    app.post("/api/v1/auth/login", async (req, reply) => {
        const data = req.body;
        const headers = req.headers;
        const res = await authClient.login(data, headers);
        return reply.send(res);
    });
}
