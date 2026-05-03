import cron from "node-cron";
import { clickhouse } from "../../../../packages/clickhouse/src/client";
import { logger } from "../../../../packages/logger/src/logger";

/**
 * Retention Worker
 * Runs every night at midnight to prune old data from ClickHouse.
 * For now, it uses a global 30-day retention policy.
 */
export function startRetentionWorker() {
  logger.info("Initializing Data Retention Worker (Daily @ Midnight)");

  cron.schedule("0 0 * * *", async () => {
    logger.info("Starting scheduled data pruning...");

    try {
      // 1. Calculate the cutoff timestamp (30 days ago)
      const retentionDays = 30; // This can be made dynamic by querying the DB
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffTimestamp = cutoffDate.getTime();

      // 2. Execute ClickHouse pruning query
      // Note: DELETE in ClickHouse is a mutation. For high-volume tables, 
      // TTL is better, but this works well for standard SaaS tiers.
      await clickhouse.command({
        query: `
          DELETE FROM events 
          WHERE timestamp < {cutoff: Int64}
        `,
        query_params: { cutoff: cutoffTimestamp }
      });

      logger.info(`Successfully pruned data older than ${retentionDays} days.`);
    } catch (error) {
      logger.error({ error }, "Failed to execute data pruning");
    }
  });
}
