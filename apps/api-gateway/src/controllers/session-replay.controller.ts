import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { uploadSessionReplay, getSessionReplay, deleteSessionReplay } from "../services/minio-client";
import { logger } from "../../../../packages/logger/src/logger";
import { promisify } from "util";
import { gzip, gunzip } from "zlib";


const prisma = new PrismaClient();
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class SessionReplayController {
  async record(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).organizationId;
    const body = req.body as any;

    if (!organizationId) {
      return reply.status(401).send({ error: "Organization context required" });
    }

    const { sessionId, traceId, events, metadata } = body;

    if (!sessionId || !Array.isArray(events)) {
      return reply.status(400).send({ error: "sessionId and events array are required" });
    }

    try {
      const eventsJson = JSON.stringify(events);
      const compressed = await gzipAsync(Buffer.from(eventsJson, "utf-8"));
      const minioPath = await uploadSessionReplay(organizationId, sessionId, compressed);

      const startTime = new Date(metadata?.startTime || Date.now());
      const endTime = metadata?.endTime ? new Date(metadata.endTime) : null;
      const durationMs = endTime ? endTime.getTime() - startTime.getTime() : null;

      const status = metadata?.hasError ? "COMPLETED" : "DISCARDED";

      const replay = await prisma.sessionReplay.upsert({
        where: { sessionId },
        update: {
          traceId: traceId || null,
          endTime,
          durationMs,
          eventCount: events.length,
          sizeBytes: compressed.length,
          minioPath,
          status: metadata?.hasError ? "COMPLETED" : status,
          hasError: metadata?.hasError || false,
          url: metadata?.url || null,
          userAgent: metadata?.userAgent || null,
        },
        create: {
          sessionId,
          traceId: traceId || null,
          organizationId,
          startTime,
          endTime,
          durationMs,
          eventCount: events.length,
          sizeBytes: compressed.length,
          minioPath,
          status,
          hasError: metadata?.hasError || false,
          url: metadata?.url || null,
          userAgent: metadata?.userAgent || null,
        },
      });

      logger.info({
        sessionId,
        traceId,
        organizationId,
        eventCount: events.length,
        sizeBytes: compressed.length,
        status: replay.status,
        message: "Session replay recorded",
      });

      return reply.send({ success: true, data: { sessionId, status: replay.status } });
    } catch (error) {
      logger.error({ error, sessionId }, "Failed to record session replay");
      return reply.status(500).send({ error: "Failed to record session replay" });
    }
  }

  async get(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = req.params as { sessionId: string };
    const user = (req as any).user;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return reply.status(401).send({ error: "Organization context required" });
    }

    try {
      const replay = await prisma.sessionReplay.findFirst({
        where: { sessionId, organizationId },
      });

      if (!replay) {
        return reply.status(404).send({ error: "Session replay not found" });
      }

      const compressed = await getSessionReplay(organizationId, sessionId);
      const decompressed = await gunzipAsync(compressed);
      const events = JSON.parse(decompressed.toString("utf-8"));

      return reply.send({
        success: true,
        data: {
          events,
          metadata: {
            sessionId: replay.sessionId,
            traceId: replay.traceId,
            url: replay.url,
            userAgent: replay.userAgent,
            startTime: replay.startTime,
            endTime: replay.endTime,
            durationMs: replay.durationMs,
            eventCount: replay.eventCount,
            status: replay.status,
            hasError: replay.hasError,
          },
        },
      });
    } catch (error) {
      logger.error({ error, sessionId }, "Failed to retrieve session replay");
      return reply.status(500).send({ error: "Failed to retrieve session replay" });
    }
  }

  async getByTrace(req: FastifyRequest, reply: FastifyReply) {
    const { traceId } = req.params as { traceId: string };
    const user = (req as any).user;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return reply.status(401).send({ error: "Organization context required" });
    }

    try {
      // First check PostgreSQL
      const replay = await prisma.sessionReplay.findFirst({
        where: { traceId, organizationId, status: "COMPLETED" },
      });

      if (replay) {
        return reply.send({
          success: true,
          data: {
            sessionId: replay.sessionId,
            traceId: replay.traceId,
            url: replay.url,
            userAgent: replay.userAgent,
            startTime: replay.startTime,
            endTime: replay.endTime,
            durationMs: replay.durationMs,
            eventCount: replay.eventCount,
            status: replay.status,
            hasError: replay.hasError,
          },
        });
      }

      // No session replay found in PostgreSQL
      return reply.send({ success: true, data: null });
    } catch (error: any) {
      logger.error({ error, traceId }, "Failed to find session replay by trace");
      return reply.status(500).send({ error: "Failed to find session replay", details: error?.message || String(error) });
    }
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const { sessionId } = req.params as { sessionId: string };
    const user = (req as any).user;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return reply.status(401).send({ error: "Organization context required" });
    }

    try {
      await deleteSessionReplay(organizationId, sessionId);
      await prisma.sessionReplay.deleteMany({
        where: { sessionId, organizationId },
      });

      return reply.send({ success: true });
    } catch (error) {
      logger.error({ error, sessionId }, "Failed to delete session replay");
      return reply.status(500).send({ error: "Failed to delete session replay" });
    }
  }
}
