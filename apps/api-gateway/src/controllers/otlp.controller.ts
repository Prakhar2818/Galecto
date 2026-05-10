import { FastifyRequest, FastifyReply } from "fastify";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/api-types/src/index";
import { v4 as uuidv4 } from "uuid";

export class OtlpController {

  async receiveTraces(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).organizationId;
    const body = req.body as any;

    try {
      const spans = body.resourceSpans?.[0]?.scopeSpans?.[0]?.spans || [];
      
      for (const span of spans) {
        const traceId = span.traceId || uuidv4();
        const spanId = span.spanId || uuidv4();
        const parentSpanId = span.parentSpanId || null;

        const event: IEvent = {
          eventId: uuidv4(),
          traceId,
          spanId,
          parentSpanId,
          tenantId: organizationId,
          type: EventType.TRACE,
          service: span.attributes?.['service.name'] || 'unknown',
          name: span.name || 'span',
          timestamp: span.startTimeUnixMs || Date.now(),
          payload: {
            durationMs: span.endTimeUnixMs - span.startTimeUnixMs,
            statusCode: span.status?.code === 2 ? 0 : span.status?.code === 1 ? 500 : 200,
            statusMessage: span.status?.message,
            attributes: span.attributes,
            events: span.events,
          }
        };

        await sendEvent("events", event);
      }

      return reply.send({ success: true });
    } catch (error) {
      console.error("OTLP trace processing error:", error);
      return reply.status(500).send({ error: "Failed to process traces" });
    }
  }

  async receiveMetrics(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).organizationId;
    const body = req.body as any;

    try {
      const metrics = body.resourceMetrics?.[0]?.scopeMetrics?.[0]?.metrics || [];
      
      for (const metric of metrics) {
        const event: IEvent = {
          eventId: uuidv4(),
          traceId: uuidv4(),
          spanId: uuidv4(),
          tenantId: organizationId,
          type: EventType.METRIC,
          service: metric.resource?.attributes?.['service.name'] || 'unknown',
          name: `metric.${metric.name}`,
          timestamp: Date.now(),
          payload: {
            metricName: metric.name,
            metricType: metric.gauge ? 'gauge' : metric.sum ? 'counter' : 'unknown',
            value: metric.gauge?.dataPoints?.[0]?.value || metric.sum?.dataPoints?.[0]?.value,
            unit: metric.unit,
          }
        };

        await sendEvent("events", event);
      }

      return reply.send({ success: true });
    } catch (error) {
      console.error("OTLP metrics processing error:", error);
      return reply.status(500).send({ error: "Failed to process metrics" });
    }
  }

  async receiveLogs(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).organizationId;
    const body = req.body as any;

    try {
      const logs = body.resourceLogs?.[0]?.scopeLogs?.[0]?.logRecords || [];
      
      for (const log of logs) {
        const event: IEvent = {
          eventId: uuidv4(),
          traceId: log.traceId || uuidv4(),
          spanId: log.spanId || uuidv4(),
          parentSpanId: undefined,
          tenantId: organizationId,
          type: EventType.LOG,
          service: log.resource?.attributes?.['service.name'] || 'unknown',
          name: log.body?.stringValue || 'log',
          timestamp: log.timeUnixNano ? Math.floor(Number(log.timeUnixNano) / 1000000) : Date.now(),
          payload: {
            severity: log.severityText,
            body: log.body,
            attributes: log.attributes,
          }
        };

        await sendEvent("events", event);
      }

      return reply.send({ success: true });
    } catch (error) {
      console.error("OTLP logs processing error:", error);
      return reply.status(500).send({ error: "Failed to process logs" });
    }
  }
}
