import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";

export async function requestContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = uuidv4();

  request.headers["x-request-id"] = requestId;

  (request as any).context = {
    requestId,
  };
}