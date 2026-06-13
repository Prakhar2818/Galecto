import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../../../packages/logger/src/logger";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/api-types/src/index";
import { v4 as uuidv4 } from "uuid";

function extractTenantId(request: FastifyRequest): string {
  // 1. Already set by auth middleware (onResponse phase)
  const orgId = (request as any).organizationId;
  if (orgId) return orgId;

  // 2. Try to decode JWT token without verification
  const authHeader = request.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload?.organizationId || "anonymous";
    } catch {
      return "anonymous";
    }
  }

  return "anonymous";
}

export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;
  const tenantId = extractTenantId(request);

  logger.info({
    traceId: context?.traceId,
    spanId: context?.spanId,
    url: request.url,
    method: request.method,
  });

  // Build full URL including host and port for replay support
  const host = request.headers.host || `localhost:${process.env.PORT || 3001}`;
  const protocol = (request as any).protocol || 'http';
  const fullUrl = `${protocol}://${host}${request.url}`;

  const event: IEvent = {
    eventId: uuidv4(),
    traceId: context?.traceId || uuidv4(),
    spanId: context?.spanId || uuidv4(),
    tenantId,
    type: EventType.TRACE,
    service: "api-gateway",
    name: `API_REQUEST ${request.method} ${request.url}`,
    timestamp: Date.now(),
    payload: { 
      url: fullUrl, 
      method: request.method,
      headers: request.headers,
      body: request.body
    },
  };
  
  try {
    await sendEvent("events", event);
  } catch (err) {
    logger.error({ err }, "Failed to send Kafka event");
  }
}

export async function responseLoggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;
  const tenantId = extractTenantId(request);
  const durationMs = context?.startTime ? Date.now() - context.startTime : undefined;

  // Build full URL including host and port for replay support
  const host = request.headers.host || `localhost:${process.env.PORT || 3001}`;
  const protocol = (request as any).protocol || 'http';
  const fullUrl = `${protocol}://${host}${request.url}`;

  logger.info({
    traceId: context?.traceId,
    spanId: context?.spanId,
    url: fullUrl,
    method: request.method,
    statusCode: reply.statusCode,
    durationMs,
  });

  const event: IEvent = {
    eventId: uuidv4(),
    traceId: context?.traceId || uuidv4(),
    spanId: context?.spanId || uuidv4(),
    tenantId,
    type: EventType.TRACE,
    service: "api-gateway",
    name: `API_RESPONSE ${request.method} ${request.url}`,
    timestamp: Date.now(),
    payload: { 
      url: fullUrl, 
      method: request.method, 
      statusCode: reply.statusCode, 
      durationMs 
    },
  };

  try {
    await sendEvent("events", event);
  } catch (err) {
    logger.error({ err }, "Failed to send Kafka event");
  }
}
