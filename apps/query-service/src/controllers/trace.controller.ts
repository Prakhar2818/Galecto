import { FastifyRequest, FastifyReply } from "fastify";
import { clickhouse } from "../../../../packages/clickhouse/src/client";

export class TraceController {
  
  async listTraces(req: FastifyRequest, reply: FastifyReply) {
    try {
      // In a real multi-tenant app, you'd extract tenantId from the auth middleware
      // For this step, we just query the 50 most recent unique traces
      const result = await clickhouse.query({
        query: `
          SELECT 
            trace_id, 
            min(timestamp) as start_time, 
            max(timestamp) as end_time,
            count() as event_count,
            groupArray(service_name) as services
          FROM events
          GROUP BY trace_id
          ORDER BY start_time DESC
          LIMIT 50
        `,
        format: 'JSONEachRow',
      });

      const traces = await result.json();
      return reply.send({ success: true, data: traces });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to query traces" });
    }
  }

  async getTraceDetails(req: FastifyRequest, reply: FastifyReply) {
    const { traceId } = req.params as { traceId: string };

    try {
      // Fetch all events for this specific traceId, ordered by time
      const result = await clickhouse.query({
        query: `
          SELECT * 
          FROM events 
          WHERE trace_id = {traceId: String}
          ORDER BY timestamp ASC
        `,
        query_params: {
          traceId,
        },
        format: 'JSONEachRow',
      });

      const events: any[] = await result.json();

      // Stitch the graph together into a tree
      const spanMap: Record<string, any> = {};
      const roots: any[] = [];

      // First pass: create nodes and index by spanId
      events.forEach(event => {
        const node = { ...event, children: [] };
        // If multiple events share the same spanId (e.g. API_REQUEST and API_RESPONSE), 
        // we might want to merge them or handle them as separate points in the same span.
        // For simplicity in a "Causality Graph", we merge events with same spanId into one span node.
        if (spanMap[event.span_id]) {
          spanMap[event.span_id].events = spanMap[event.span_id].events || [];
          spanMap[event.span_id].events.push(event);
        } else {
          node.events = [event];
          spanMap[event.span_id] = node;
        }
      });

      // Second pass: build relationships
      Object.values(spanMap).forEach(node => {
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
        tree: roots
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to get trace details" });
    }
  }
}
