import { FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: any,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;
  const requestId = context?.requestId || request.headers["x-request-id"];

  reply.status(error.statusCode || 500).send({
    requestId,
    message: error.message || "Something went wrong",
  });
}
