import { FastifyRequest, FastifyReply } from "fastify";
import { clickhouse } from "../../../../packages/clickhouse/src/client";

export class TraceController {
  async listTraces(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const tenantId = user?.organizationId;
      const { page = '1', limit = '50' } = req.query as any;
      
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      const offset = (pageNum - 1) * limitNum;

      const countResult = await clickhouse.query({
        query: `
          SELECT count(DISTINCT trace_id) as total
          FROM events
          WHERE tenant_id = {tenantId:String}
        `,
        query_params: { tenantId: tenantId || 'default' },
        format: "JSONEachRow",
      });
      const countData: any[] = await countResult.json();
      const total = Number(countData[0]?.total) || 0;

      const result = await clickhouse.query({
        query: `
          SELECT 
            trace_id, 
            min(timestamp) as start_time, 
            max(timestamp) as end_time,
            count() as event_count,
            groupArray(service_name) as services,
            argMin(service_name, timestamp) as root_service,
            argMin(event_name, timestamp) as root_event,
            argMin(payload, timestamp) as root_payload,
            argMin(status_code, timestamp) as root_status_code,
            argMin(parent_span_id, timestamp) as root_parent_span_id
          FROM events
          WHERE tenant_id = {tenantId:String}
          GROUP BY trace_id
          ORDER BY start_time DESC
          LIMIT {limit:Int32}
          OFFSET {offset:Int32}
        `,
        query_params: { 
          tenantId: tenantId || 'default',
          limit: limitNum,
          offset: offset
        },
        format: "JSONEachRow",
      });

      const rawTraces: any[] = await result.json();
      
      // Enrich traces with human-readable status and endpoint
      const traces = rawTraces.map((t) => {
        let status = 'SUCCESS';
        const statusCode = Number(t.root_status_code) || 0;
        if (statusCode >= 500) status = 'ERROR';
        else if (statusCode >= 400) status = 'WARNING';
        else if (statusCode === 0 && t.event_count > 0) status = 'INFO';

        let endpoint = '';
        try {
          const payload = typeof t.root_payload === 'string' ? JSON.parse(t.root_payload) : (t.root_payload || {});
          endpoint = payload.url || payload.path || payload.endpoint || payload.route || 
                     payload.attributes?.['http.url'] || payload.attributes?.['http.path'] || 
                     payload.event || '';
          if (endpoint && payload.method) {
            endpoint = `${payload.method} ${endpoint}`;
          }
        } catch {
          endpoint = '';
        }

        // Resolve display name for root event
        let displayName = t.root_event || 'Unknown';
        try {
          const payload = typeof t.root_payload === 'string' ? JSON.parse(t.root_payload) : (t.root_payload || {});
          if (displayName === 'INGEST_LOG' || displayName === 'log') {
            if (payload.event) displayName = payload.event;
            else if (payload.name) displayName = payload.name;
          } else if (displayName === 'span' || displayName === 'TRACE') {
            if (payload.attributes?.['http.route']) displayName = payload.attributes['http.route'];
            else if (payload.attributes?.['http.url']) {
              try {
                const url = new URL(payload.attributes['http.url']);
                displayName = url.pathname;
              } catch {
                displayName = payload.attributes['http.url'];
              }
            }
          }
        } catch {
          // keep original
        }

        return {
          ...t,
          status,
          status_code: statusCode,
          endpoint,
          display_name: displayName,
          // Format services as unique array
          services: Array.isArray(t.services) ? [...new Set(t.services)] : []
        };
      });

      return reply.send({ 
        success: true, 
        data: traces,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to query traces" });
    }
  }

  async getTraceDetails(req: FastifyRequest, reply: FastifyReply) {
    const { traceId } = req.params as { traceId: string };
    const user = req.user as any;
    const tenantId = user?.organizationId;

    try {
      const result = await clickhouse.query({
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

      const events: any[] = await result.json();

      const spanMap: Record<string, any> = {};
      const roots: any[] = [];

      // Helper to resolve meaningful display name from event payload
      const resolveDisplayName = (event: any): string => {
        const payload = event.payload || {};
        const internalName = event.event_name || 'Unknown';

        // For INGEST_LOG events, the actual event name is usually in payload.event or payload.name
        if (internalName === 'INGEST_LOG' || internalName === 'log') {
          if (payload.event) return payload.event;
          if (payload.name) return payload.name;
          if (payload.event_name) return payload.event_name;
        }

        // For OTLP spans, use the span name if available
        if (internalName === 'span' || internalName === 'TRACE') {
          if (payload.attributes && payload.attributes['http.route']) return payload.attributes['http.route'];
          if (payload.attributes && payload.attributes['http.url']) {
            try {
              const url = new URL(payload.attributes['http.url']);
              return `${url.pathname}${url.search}`;
            } catch {
              return payload.attributes['http.url'];
            }
          }
          if (payload.statusMessage) return payload.statusMessage;
        }

        // For RESPONSE events, try to get the endpoint
        if (internalName.includes('RESPONSE') || internalName.includes('REQUEST')) {
          if (payload.url) {
            try {
              const url = new URL(payload.url);
              return `${payload.method || 'GET'} ${url.pathname}`;
            } catch {
              return payload.url;
            }
          }
          if (payload.path) return `${payload.method || 'GET'} ${payload.path}`;
          if (payload.route) return `${payload.method || 'GET'} ${payload.route}`;
          if (payload.endpoint) return payload.endpoint;
        }

        // If payload has a message or body, use it
        if (payload.message && typeof payload.message === 'string') return payload.message;
        if (payload.body?.stringValue) return payload.body.stringValue;

        // Fallback to internal name with a system prefix if it looks generic
        const genericNames = ['INGEST_LOG', 'API_REQUEST', 'RESPONSE', 'span', 'log', 'TRACE'];
        if (genericNames.includes(internalName)) {
          return `[system] ${internalName}`;
        }

        return internalName;
      };

      events.forEach((event) => {
        const displayName = resolveDisplayName(event);
        const node = { ...event, display_name: displayName, children: [] };
        if (spanMap[event.span_id]) {
          spanMap[event.span_id].events = spanMap[event.span_id].events || [];
          spanMap[event.span_id].events.push(event);
        } else {
          node.events = [event];
          spanMap[event.span_id] = node;
        }
      });

      Object.values(spanMap).forEach((node) => {
        if (node.parent_span_id && spanMap[node.parent_span_id]) {
          spanMap[node.parent_span_id].children.push(node);
        } else {
          roots.push(node);
        }
      });

      return reply.send({
        success: true,
        traceId,
        totalEvents: events.length,
        tree: roots,
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to get trace details" });
    }
  }

  async listAnomalies(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const tenantId = user?.organizationId;

      const result = await clickhouse.query({
        query: `
          SELECT 
            trace_id, 
            service_name,
            event_name as status,
            timestamp as start_time
          FROM events
          WHERE 
            tenant_id = {tenantId:String} AND 
            (
              (event_name LIKE '%RESPONSE%' AND status_code >= 400) OR
              (event_name LIKE '%INGEST_LOG%' AND 
                (JSONExtractInt(payload, 'payload.attributes.status') >= 400 OR 
                 JSONExtractInt(payload, 'attributes.status') >= 400 OR
                 status_code >= 400))
            )
          ORDER BY timestamp DESC
          LIMIT 20
        `,
        query_params: { tenantId: tenantId || 'default' },
        format: "JSONEachRow",
      });

      const anomalies = await result.json();
      return reply.send({ success: true, data: anomalies });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to query anomalies" });
    }
  }
  async getPerformanceMetrics(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const tenantId = user?.organizationId;

      const result = await clickhouse.query({
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
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to query metrics" });
    }
  }

  async getAnomalySummary(req: FastifyRequest, reply: FastifyReply) {
    try {
      const user = req.user as any;
      const tenantId = user?.organizationId;

      // Get anomaly events in the last 24h
      // Align query logic with listAnomalies: check event_name and extract status from payload for INGEST_LOG
      const result = await clickhouse.query({
        query: `
          SELECT 
            service_name,
            event_name,
            status_code,
            count() as anomaly_count,
            avg(duration_ms) as avg_latency,
            max(timestamp) as last_occurred,
            groupArray(trace_id) as affected_traces
          FROM events
          WHERE 
            tenant_id = {tenantId:String} AND 
            timestamp > now() - INTERVAL 24 HOUR AND
            (
              (event_name LIKE '%RESPONSE%' AND status_code >= 400) OR
              (event_name LIKE '%INGEST_LOG%' AND 
                (JSONExtractInt(payload, 'payload.attributes.status') >= 400 OR 
                 JSONExtractInt(payload, 'attributes.status') >= 400 OR
                 status_code >= 400)) OR
              (duration_ms > 500)
            )
          GROUP BY service_name, event_name, status_code
          ORDER BY anomaly_count DESC
        `,
        query_params: { tenantId: tenantId || 'default' },
        format: "JSONEachRow",
      });

      const anomalies: any[] = await result.json();
      
      // Calculate summary
      const totalAnomalies = anomalies.reduce((sum, a) => sum + Number(a.anomaly_count), 0);
      const affectedServices = [...new Set(anomalies.map(a => a.service_name))];
      const criticalAnomalies = anomalies.filter(a => Number(a.status_code) >= 500);
      const warningAnomalies = anomalies.filter(a => Number(a.status_code) >= 400 && Number(a.status_code) < 500);
      const latencyAnomalies = anomalies.filter(a => Number(a.avg_latency) > 500 && Number(a.status_code) < 400);

      return reply.send({
        success: true,
        data: {
          totalAnomalies,
          affectedServicesCount: affectedServices.length,
          affectedServices,
          criticalCount: criticalAnomalies.reduce((sum, a) => sum + Number(a.anomaly_count), 0),
          warningCount: warningAnomalies.reduce((sum, a) => sum + Number(a.anomaly_count), 0),
          latencyCount: latencyAnomalies.reduce((sum, a) => sum + Number(a.anomaly_count), 0),
          details: anomalies.map((a: any) => ({
            service: a.service_name,
            event: a.event_name,
            statusCode: Number(a.status_code),
            count: Number(a.anomaly_count),
            avgLatency: Number(a.avg_latency),
            lastOccurred: a.last_occurred,
            affectedTraces: (a.affected_traces || []).slice(0, 5)
          }))
        }
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to query anomaly summary" });
    }
  }
}
