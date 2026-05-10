"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceController = void 0;
const client_1 = require("../../../../packages/clickhouse/src/client");
class TraceController {
    async listTraces(req, reply) {
        try {
            const user = req.user;
            const tenantId = user?.organizationId;
            const result = await client_1.clickhouse.query({
                query: `
          SELECT 
            trace_id, 
            min(timestamp) as start_time, 
            max(timestamp) as end_time,
            count() as event_count,
            groupArray(service_name) as services
          FROM events
          WHERE tenant_id = {tenantId:String}
          GROUP BY trace_id
          ORDER BY start_time DESC
          LIMIT 50
        `,
                query_params: { tenantId: tenantId || 'default' },
                format: "JSONEachRow",
            });
            const traces = await result.json();
            return reply.send({ success: true, data: traces });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to query traces" });
        }
    }
    async getTraceDetails(req, reply) {
        const { traceId } = req.params;
        const user = req.user;
        const tenantId = user?.organizationId;
        try {
            const result = await client_1.clickhouse.query({
                query: `
          SELECT * 
          FROM events 
          WHERE tenant_id = {tenantId:String} AND trace_id = {traceId:String}
          ORDER BY timestamp ASC
        `,
                query_params: {
                    tenantId: tenantId || 'default',
                    traceId,
                },
                format: "JSONEachRow",
            });
            const events = await result.json();
            const spanMap = {};
            const roots = [];
            events.forEach((event) => {
                const node = { ...event, children: [] };
                if (spanMap[event.span_id]) {
                    spanMap[event.span_id].events = spanMap[event.span_id].events || [];
                    spanMap[event.span_id].events.push(event);
                }
                else {
                    node.events = [event];
                    spanMap[event.span_id] = node;
                }
            });
            Object.values(spanMap).forEach((node) => {
                if (node.parent_span_id && spanMap[node.parent_span_id]) {
                    spanMap[node.parent_span_id].children.push(node);
                }
                else {
                    roots.push(node);
                }
            });
            return reply.send({
                success: true,
                traceId,
                totalEvents: events.length,
                tree: roots,
            });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to get trace details" });
        }
    }
    async listAnomalies(req, reply) {
        try {
            const user = req.user;
            const tenantId = user?.organizationId;
            const result = await client_1.clickhouse.query({
                query: `
          SELECT 
            trace_id, 
            service_name,
            event_name as status,
            timestamp as start_time
          FROM events
          WHERE tenant_id = {tenantId:String} AND event_name LIKE '%RESPONSE%' AND status_code >= 400
          ORDER BY timestamp DESC
          LIMIT 20
        `,
                query_params: { tenantId: tenantId || 'default' },
                format: "JSONEachRow",
            });
            const anomalies = await result.json();
            return reply.send({ success: true, data: anomalies });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to query anomalies" });
        }
    }
    async getPerformanceMetrics(req, reply) {
        try {
            const user = req.user;
            const tenantId = user?.organizationId;
            const result = await client_1.clickhouse.query({
                query: `
          SELECT 
            service_name,
            count() as total_requests,
            countIf(status_code >= 400 AND status_code < 600) as errors,
            avg(duration_ms) as avg_latency,
            quantile(0.99)(duration_ms) as p99_latency
          FROM events
          WHERE tenant_id = {tenantId:String} AND event_name LIKE '%RESPONSE%'
          GROUP BY service_name
        `,
                query_params: { tenantId: tenantId || 'default' },
                format: "JSONEachRow",
            });
            const metrics = await result.json();
            return reply.send({ success: true, data: metrics });
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to query metrics" });
        }
    }
}
exports.TraceController = TraceController;
