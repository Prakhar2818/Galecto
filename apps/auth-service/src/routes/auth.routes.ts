import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middlewares/auth.middleware";

const prisma = new PrismaClient();

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.post("/register", controller.register);
  app.post("/login", controller.login);
  app.post("/verify-email-otp", controller.verifyEmailOTP);

  app.post("/logout", async (request, reply) => {
    return reply.send({ 
      success: true, 
      message: "Logged out successfully" 
    });
  });

  app.post("/2fa/setup", { preHandler: authenticate }, controller.setup2FA);
  app.post("/2fa/verify-enable", { preHandler: authenticate }, controller.verifyAndEnable2FA);
  app.post("/2fa/disable", { preHandler: authenticate }, controller.disable2FA);

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

    if (!key.project) {
      return reply.status(401).send({ error: "API key not associated with project" });
    }

    return {
      organizationId: key.project.organizationId,
      projectId: key.projectId,
      keyName: key.name
    };
  });
}