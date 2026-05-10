"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogController = void 0;
const client_1 = require("../../../../packages/clickhouse/src/client");
class LogController {
    async listLogs(req, reply) {
        const { service, search, limit = 100 } = req.query;
        const user = req.user;
        const tenantId = user?.organizationId;
        try {
            let whereClause = "tenant_id = {tenantId:String}";
            const params = { tenantId: tenantId || 'default' };
            if (service) {
                whereClause += " AND service_name = {service: String}";
                params.service = service;
            }
            if (search) {
                whereClause +=
                    " AND (payload LIKE {search: String} OR event_name LIKE {search: String})";
                params.search = `%${search}%`;
            }
            const result = await client_1.clickhouse.query({
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
        }
        catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to query logs" });
        }
    }
}
exports.LogController = LogController;
