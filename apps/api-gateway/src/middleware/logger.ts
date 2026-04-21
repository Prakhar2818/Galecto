import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../../../packages/logger/src/logger"

export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;

  logger.info({
    requestId: context?.requestId,
    url: request.url,
    method: request.method,
  });
}