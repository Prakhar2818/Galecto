import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../../../packages/logger/src/logger";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/types/src/index";
import { v4 as uuidv4 } from "uuid";

export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;

  logger.info({
    traceId: context?.traceId,
    spanId: context?.spanId,
    url: request.url,
    method: request.method,
  });

  const event: IEvent = {
    eventId: uuidv4(),
    traceId: context?.traceId || uuidv4(),
    spanId: context?.spanId || uuidv4(),
    type: EventType.TRACE,
    service: "api-gateway",
    name: `API_REQUEST ${request.method} ${request.url}`,
    timestamp: Date.now(),
    payload: { 
      url: request.url, 
      method: request.method,
      headers: request.headers,
      body: request.body
    },
  };
  
  sendEvent("events", event).catch(err => logger.error({ err }, "Failed to send Kafka event"));
}

export async function responseLoggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const context = (request as any).context;
  const durationMs = context?.startTime ? Date.now() - context.startTime : undefined;

  logger.info({
    traceId: context?.traceId,
    spanId: context?.spanId,
    url: request.url,
    method: request.method,
    statusCode: reply.statusCode,
    durationMs,
  });

  const event: IEvent = {
    eventId: uuidv4(),
    traceId: context?.traceId || uuidv4(),
    spanId: context?.spanId || uuidv4(),
    type: EventType.TRACE,
    service: "api-gateway",
    name: `API_RESPONSE ${request.method} ${request.url}`,
    timestamp: Date.now(),
    payload: { 
      url: request.url, 
      method: request.method, 
      statusCode: reply.statusCode, 
      durationMs 
    },
  };

  sendEvent("events", event).catch(err => logger.error({ err }, "Failed to send Kafka event"));
}
