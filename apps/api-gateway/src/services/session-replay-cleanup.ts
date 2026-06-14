import { PrismaClient } from "@prisma/client";
import { deleteSessionReplay } from "./minio-client";
import { logger } from "../../../../packages/logger/src/logger";

const prisma = new PrismaClient();

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function cleanupOldSessionReplays(): Promise<void> {
  try {
    // Find all organizations with retention days
    const organizations = await prisma.organization.findMany({
      select: { id: true, retentionDays: true }
    });

    for (const org of organizations) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - org.retentionDays);

      const oldReplays = await prisma.sessionReplay.findMany({
        where: {
          organizationId: org.id,
          createdAt: { lt: cutoffDate }
        },
        select: { id: true, sessionId: true, organizationId: true }
      });

      if (oldReplays.length === 0) continue;

      for (const replay of oldReplays) {
        try {
          await deleteSessionReplay(replay.organizationId, replay.sessionId);
        } catch (e) {
          logger.warn({ sessionId: replay.sessionId, error: e }, "Failed to delete MinIO object during cleanup");
        }
      }

      await prisma.sessionReplay.deleteMany({
        where: {
          id: { in: oldReplays.map((r: { id: string }) => r.id) }
        }
      });

      logger.info({
        organizationId: org.id,
        deletedCount: oldReplays.length,
        retentionDays: org.retentionDays,
        message: "Cleaned up old session replays"
      });
    }
  } catch (error) {
    logger.error({ error }, "Session replay cleanup failed");
  }
}

export function startSessionReplayCleanup(): void {
  // Run immediately on startup
  cleanupOldSessionReplays().catch(console.error);

  // Then schedule daily
  setInterval(() => {
    cleanupOldSessionReplays().catch(console.error);
  }, CLEANUP_INTERVAL_MS);

  logger.info("Session replay cleanup worker started");
}
