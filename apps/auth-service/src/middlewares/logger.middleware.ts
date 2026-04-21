import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../../../packages/logger/src/logger";

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

export async function responseLoggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;
  const durationMs = context?.startTime ? Date.now() - context.startTime : undefined;

  logger.info({
    requestId: context?.requestId,
    url: request.url,
    method: request.method,
    statusCode: reply.statusCode,
    durationMs,
  });
}
