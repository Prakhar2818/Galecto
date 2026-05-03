import { FastifyRequest, FastifyReply } from "fastify";
import { clickhouse } from "../../../../packages/clickhouse/src/client";

export class LogController {
  async listLogs(req: FastifyRequest, reply: FastifyReply) {
    const { service, search, limit = 100 } = req.query as any;

    try {
      let whereClause = "1=1";
      const params: any = {};

      if (service) {
        whereClause += " AND service_name = {service: String}";
        params.service = service;
      }

      if (search) {
        whereClause +=
          " AND (payload LIKE {search: String} OR event_name LIKE {search: String})";
        params.search = `%${search}%`;
      }

      const result = await clickhouse.query({
        query: `
          SELECT 
            timestamp,
            service_name,
            event_name,
            payload
          FROM events
          WHERE ${whereClause}
          ORDER BY timestamp DESC
          LIMIT {limit: Int32}
        `,
        query_params: {
          ...params,
          limit: Number(limit),
        },
        format: "JSONEachRow",
      });

      const logs = await result.json();
      return reply.send({ success: true, data: logs });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: "Failed to query logs" });
    }
  }
}
