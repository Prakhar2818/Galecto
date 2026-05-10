import cron from "node-cron";
import { clickhouse } from "../../../../packages/clickhouse/src/client";
import { logger } from "../../../../packages/logger/src/logger";

export function startRetentionWorker() {
  logger.info("Initializing Data Retention Worker (Daily @ Midnight)");

  cron.schedule("0 0 * * *", async () => {
    logger.info("Starting scheduled data pruning...");

    try {
      const result = await clickhouse.query({
        query: `
          SELECT distinct tenant_id as id, 30 as retentionDays 
          FROM events 
          LIMIT 100
        `,
        format: 'JSONEachRow',
      });
      
      const organizations = await result.json() as any[];

      for (const org of organizations) {
        const retentionDays = org.retentionDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffTimestamp = cutoffDate.getTime();

        await clickhouse.command({
          query: `
            DELETE FROM events 
            WHERE tenant_id = {tenantId:String} AND timestamp < {cutoff:Int64}
          `,
          query_params: { 
            tenantId: org.id,
            cutoff: cutoffTimestamp 
          }
        });

        logger.info({ 
          organizationId: org.id, 
          retentionDays 
        }, "Pruned data for organization");
      }

      logger.info("Successfully completed tenant-aware data pruning");
    } catch (error) {
      logger.error({ error }, "Failed to execute data pruning");
    }
  });
}