import { FastifyRequest, FastifyReply } from "fastify";
import { redis } from "../../../../packages/redis/src/client";
import { logger } from "../../../../packages/logger/src/logger";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip auth for internal /health routes if you have them, etc.
  
  const authHeader = request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({ error: "Missing or invalid Authorization header" });
    return;
  }

  const apiKey = authHeader.split(" ")[1];
  
  try {
    // Check if API key is in Redis cache
    const organizationId = await redis.get(`apikey:${apiKey}`);
    
    if (!organizationId) {
      // In a real scenario, you'd fetch from Auth Service / Postgres if not in Redis
      // For now, we reject if not cached (you can seed Redis when keys are created)
      reply.status(401).send({ error: "Invalid API Key" });
      return;
    }

    (request as any).organizationId = organizationId;
  } catch (error) {
    logger.error({ error }, "Failed to validate API key");
    reply.status(500).send({ error: "Internal Server Error" });
  }
}
