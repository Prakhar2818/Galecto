import { FastifyRequest, FastifyReply } from "fastify";
import { clickhouse } from "../../../../packages/clickhouse/src/client";

export class ServiceMapController {
  
  async getServiceDependencies(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as any;
    const tenantId = user?.organizationId;
    const { windowHours = 24 } = req.query as any;

    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            service_name as source,
            JSONExtractString(payload, 'downstream_service') as target,
            count() as callCount,
            avg(JSONExtractInt(payload, 'durationMs')) as avgDuration,
            countIf(JSONExtractInt(payload, 'statusCode') >= 400) as errorCount
          FROM events
          WHERE 
            tenant_id = {tenantId:String} AND 
            event_name LIKE '%REQUEST%' AND
            timestamp > now() - INTERVAL {windowHours:Int32} HOUR
          GROUP BY service_name, target
          HAVING target != ''
        `,
        query_params: { 
          tenantId: tenantId || 'default',
          windowHours: Number(windowHours) 
        },
        format: 'JSONEachRow',
      });

      const edges: any[] = await result.json();
      
      const nodes = new Map();
      for (const edge of edges) {
        nodes.set(edge.source, { name: edge.source, calls: 0, errors: 0 });
        nodes.set(edge.target, { name: edge.target, calls: 0, errors: 0 });
      }

      for (const edge of edges) {
        const sourceNode: any = nodes.get(edge.source);
        const targetNode: any = nodes.get(edge.target);
        sourceNode.calls += edge.callCount;
        sourceNode.errors += edge.errorCount;
        targetNode.calls += edge.callCount;
        targetNode.errors += edge.errorCount;
      }

      return reply.send({
        success: true,
        data: {
          nodes: Array.from(nodes.values()),
          edges
        }
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to get service dependencies" });
    }
  }

  async getAnomalyTrends(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as any;
    const tenantId = user?.organizationId;
    const { days = 7 } = req.query as any;

    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            toDate(timestamp) as date,
            service_name as service,
            count() as totalEvents,
            countIf(status_code >= 500) as serverErrors,
            countIf(status_code >= 400 AND status_code < 500) as clientErrors,
            avg(duration_ms) as avgLatency,
            quantile(0.99)(duration_ms) as p99Latency
          FROM events
          WHERE 
            tenant_id = {tenantId:String} AND 
            timestamp > now() - INTERVAL {days:Int32} DAY AND
            event_name LIKE '%RESPONSE%'
          GROUP BY date, service_name
          ORDER BY date ASC
        `,
        query_params: { 
          tenantId: tenantId || 'default',
          days: Number(days)
        },
        format: 'JSONEachRow',
      });

      const trends = await result.json();

      return reply.send({
        success: true,
        data: trends
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to get anomaly trends" });
    }
  }

  async getSloStatus(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as any;
    const tenantId = user?.organizationId;

    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            service_name as service,
            count() as totalRequests,
            countIf(status_code >= 500) as errorCount,
            (countIf(status_code < 500) * 100.0 / count()) as successRate,
            (countIf(duration_ms > 500) * 100.0 / count()) as slowRequestRate
          FROM events
          WHERE 
            tenant_id = {tenantId:String} AND 
            timestamp > now() - INTERVAL 7 DAY AND
            event_name LIKE '%RESPONSE%'
          GROUP BY service_name
        `,
        query_params: { tenantId: tenantId || 'default' },
        format: 'JSONEachRow',
      });

      const sloStatus = await result.json();

      const enriched = sloStatus.map((s: any) => ({
        ...s,
        errorRate: 100 - s.successRate,
        meetsErrorSlo: s.successRate >= 99,
        meetsLatencySlo: s.slowRequestRate < 5
      }));

      return reply.send({
        success: true,
        data: enriched
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to get SLO status" });
    }
  }
}