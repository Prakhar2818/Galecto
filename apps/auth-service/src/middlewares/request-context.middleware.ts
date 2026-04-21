import { randomUUID } from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";

function getRequestId(request: FastifyRequest) {
  const headerValue = request.headers["x-request-id"];

  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue;
  }

  if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
    return headerValue[0];
  }

  return randomUUID();
}

export async function requestContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = getRequestId(request);

  request.headers["x-request-id"] = requestId;
  reply.header("x-request-id", requestId);

  (request as any).context = {
    requestId,
    startTime: Date.now(),
  };
}
