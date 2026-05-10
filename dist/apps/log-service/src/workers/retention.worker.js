"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRetentionWorker = startRetentionWorker;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const client_2 = require("../../../../packages/clickhouse/src/client");
const logger_1 = require("../../../../packages/logger/src/logger");
const prisma = new client_1.PrismaClient();
function startRetentionWorker() {
    logger_1.logger.info("Initializing Data Retention Worker (Daily @ Midnight)");
    node_cron_1.default.schedule("0 0 * * *", async () => {
        logger_1.logger.info("Starting scheduled data pruning...");
        try {
            const organizations = await prisma.organization.findMany({
                select: { id: true, retentionDays: true }
            });
            for (const org of organizations) {
                const retentionDays = org.retentionDays || 30;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
                const cutoffTimestamp = cutoffDate.getTime();
                await client_2.clickhouse.command({
                    query: `
            DELETE FROM events 
            WHERE tenant_id = {tenantId:String} AND timestamp < {cutoff:Int64}
          `,
                    query_params: {
                        tenantId: org.id,
                        cutoff: cutoffTimestamp
                    }
                });
                logger_1.logger.info({
                    organizationId: org.id,
                    retentionDays
                }, "Pruned data for organization");
            }
            logger_1.logger.info("Successfully completed tenant-aware data pruning");
        }
        catch (error) {
            logger_1.logger.error({ error }, "Failed to execute data pruning");
        }
    });
}
;
