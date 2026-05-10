"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtlpController = void 0;
const producer_1 = require("../../../packages/kafka/src/producer");
const index_1 = require("../../../packages/types/src/index");
const uuid_1 = require("uuid");
class OtlpController {
    async receiveTraces(req, reply) {
        const organizationId = req.organizationId;
        const body = req.body;
        try {
            const spans = body.resourceSpans?.[0]?.scopeSpans?.[0]?.spans || [];
            for (const span of spans) {
                const traceId = span.traceId || (0, uuid_1.v4)();
                const spanId = span.spanId || (0, uuid_1.v4)();
                const parentSpanId = span.parentSpanId || null;
                const event = {
                    eventId: (0, uuid_1.v4)(),
                    traceId,
                    spanId,
                    parentSpanId,
                    tenantId: organizationId,
                    type: index_1.EventType.TRACE,
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
                await (0, producer_1.sendEvent)("events", event);
            }
            return reply.send({ success: true });
        }
        catch (error) {
            console.error("OTLP trace processing error:", error);
            return reply.status(500).send({ error: "Failed to process traces" });
        }
    }
    async receiveMetrics(req, reply) {
        const organizationId = req.organizationId;
        const body = req.body;
        try {
            const metrics = body.resourceMetrics?.[0]?.scopeMetrics?.[0]?.metrics || [];
            for (const metric of metrics) {
                const event = {
                    eventId: (0, uuid_1.v4)(),
                    traceId: (0, uuid_1.v4)(),
                    spanId: (0, uuid_1.v4)(),
                    tenantId: organizationId,
                    type: index_1.EventType.METRIC,
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
                await (0, producer_1.sendEvent)("events", event);
            }
            return reply.send({ success: true });
        }
        catch (error) {
            console.error("OTLP metrics processing error:", error);
            return reply.status(500).send({ error: "Failed to process metrics" });
        }
    }
    async receiveLogs(req, reply) {
        const organizationId = req.organizationId;
        const body = req.body;
        try {
            const logs = body.resourceLogs?.[0]?.scopeLogs?.[0]?.logRecords || [];
            for (const log of logs) {
                const event = {
                    eventId: (0, uuid_1.v4)(),
                    traceId: log.traceId || (0, uuid_1.v4)(),
                    spanId: log.spanId || (0, uuid_1.v4)(),
                    parentSpanId: null,
                    tenantId: organizationId,
                    type: index_1.EventType.LOG,
                    service: log.resource?.attributes?.['service.name'] || 'unknown',
                    name: log.body?.stringValue || 'log',
                    timestamp: log.timeUnixNano ? Math.floor(Number(log.timeUnixNano) / 1000000) : Date.now(),
                    payload: {
                        severity: log.severityText,
                        body: log.body,
                        attributes: log.attributes,
                    }
                };
                await (0, producer_1.sendEvent)("events", event);
            }
            return reply.send({ success: true });
        }
        catch (error) {
            console.error("OTLP logs processing error:", error);
            return reply.status(500).send({ error: "Failed to process logs" });
        }
    }
}
exports.OtlpController = OtlpController;
