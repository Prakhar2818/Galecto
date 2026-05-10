"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("../controllers/auth.controller");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function authRoutes(app) {
    const controller = new auth_controller_1.AuthController();
    app.post("/register", controller.register);
    app.post("/login", controller.login);
    app.post("/verify-api-key", async (request, reply) => {
        const { apiKey } = request.body;
        if (!apiKey) {
            return reply.status(400).send({ error: "API key required" });
        }
        const key = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { project: { include: { organization: true } } }
        });
        if (!key || (key.expiresAt && key.expiresAt < new Date())) {
            return reply.status(401).send({ error: "Invalid or expired API key" });
        }
        return {
            organizationId: key.project.organizationId,
            projectId: key.projectId,
            keyName: key.name
        };
    });
}
