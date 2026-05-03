import { FastifyRequest, FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";

function getHeaderValue(request: FastifyRequest, key: string) {
  const value = request.headers[key];
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value[0]?.trim()) return value[0];
  return null;
}

export async function requestContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceId = getHeaderValue(request, "x-trace-id") || uuidv4();
  const spanId = uuidv4(); // Gateway creates the first span

  request.headers["x-trace-id"] = traceId;
  request.headers["x-span-id"] = spanId;
  
  reply.header("x-trace-id", traceId);
  reply.header("x-span-id", spanId);

  (request as any).context = {
    traceId,
    spanId,
    startTime: Date.now(),
  };
}
