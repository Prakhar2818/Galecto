import { FastifyRequest, FastifyReply } from "fastify";
import { redis } from "../../../../packages/redis/src/client";
import { logger } from "../../../../packages/logger/src/logger";
import axios from "axios";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4000";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  
  try {
    let organizationId: string | null = null;

    // Check if token is in Redis cache (API key)
    organizationId = await redis.get(`apikey:${token}`);
    
    // If not in Redis, verify against auth service
    if (!organizationId) {
      try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify-api-key`, 
          { apiKey: token },
          { timeout: 2000 }
        );
        if (response.data?.organizationId) {
          organizationId = response.data.organizationId;
          // Cache in Redis for future requests (24 hour TTL)
          await redis.set(`apikey:${token}`, organizationId!, "EX", 86400);
        }
      } catch (authErr) {
        logger.debug({ token: token.substring(0, 10) }, "API key not found in auth service");
      }
    }

    if (!organizationId) {
      reply.status(401).send({ error: "Invalid API Key" });
      return;
    }

    (request as any).organizationId = organizationId;
    (request as any).authType = "api-key";
  } catch (error) {
    logger.error({ error }, "Failed to validate API key");
    reply.status(500).send({ error: "Internal Server Error" });
  }
}
