import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.post("/register", controller.register);
  app.post("/login", controller.login);

  app.post("/verify-api-key", async (request, reply) => {
    const { apiKey } = request.body as { apiKey: string };
    
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