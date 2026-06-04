import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { clickhouse } from "../../../../packages/clickhouse/src/client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../../../packages/logger/src/logger";
import { replayProtection } from "../services/replay-protection";

const prisma = new PrismaClient();

export class ReplayController {
   
  async executeReplay(req: FastifyRequest, reply: FastifyReply) {
    const { traceId } = req.params as { traceId: string };
    const user = (req as any).user;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return reply.status(401).send({ error: "Organization context required" });
    }

    try {
      const result = await clickhouse.query({
        query: `
          SELECT payload 
          FROM events 
          WHERE trace_id = {traceId: String} AND event_name LIKE 'API_REQUEST%'
          LIMIT 1
        `,
        query_params: { traceId },
        format: 'JSONEachRow',
      });

      const row: any = await result.json();
      if (!row || row.length === 0) {
        return reply.status(404).send({ error: "Original request metadata not found" });
      }

      const originalPayload = JSON.parse(row[0].payload);
      let { method, url, headers, body } = originalPayload;

      const urlValidation = replayProtection.validateTargetUrl(url);
      if (!urlValidation.valid) {
        return reply.status(400).send({ error: urlValidation.error });
      }

      headers = replayProtection.filterHeaders(headers);
      body = replayProtection.maskPii(body);
      body = replayProtection.redactSensitiveFields(body);

      const replayExecution = await prisma.replayExecution.create({
        data: {
          traceId,
          organizationId,
          status: 'RUNNING',
          requestMethod: method,
          requestUrl: url,
          requestHeaders: JSON.stringify(headers),
          requestBody: body ? JSON.stringify(body) : null,
        }
      });

      const replayTraceId = `replay_${uuidv4()}`;
      
      logger.info({ 
        originalTraceId: traceId, 
        replayTraceId, 
        replayId: replayExecution.id,
        message: "Executing protected shadow replay" 
      });

      try {
        const response = await axios({
          method,
          url: url,
          data: body,
          headers: {
            ...headers,
            'x-trace-id': replayTraceId,
            'x-original-trace-id': traceId,
            'x-galecto-replay': 'true'
          },
          validateStatus: () => true
        });

        const maskedResponse = replayProtection.maskPii(response.data);

        await prisma.replayExecution.update({
          where: { id: replayExecution.id },
          data: {
            status: 'COMPLETED',
            responseStatus: response.status,
            responseBody: JSON.stringify(maskedResponse),
            completedAt: new Date()
          }
        });

        return reply.send({ 
          success: true, 
          replayId: replayExecution.id,
          replayTraceId, 
          originalTraceId: traceId,
          statusCode: response.status 
        });
      } catch (axiosError: any) {
        await prisma.replayExecution.update({
          where: { id: replayExecution.id },
          data: {
            status: 'FAILED',
            errorMessage: axiosError.message,
            completedAt: new Date()
          }
        });

        return reply.status(500).send({ 
          error: "Failed to re-fire request", 
          details: axiosError.message 
        });
      }

    } catch (error) {
      logger.error({ error }, "Replay execution failed");
      return reply.status(500).send({ error: "Internal server error during replay" });
    }
  }

  async listReplays(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return reply.status(401).send({ error: "Organization context required" });
    }

    const replays = await prisma.replayExecution.findMany({
      where: { organizationId },
      orderBy: { executedAt: 'desc' },
      take: 50
    });

    return reply.send({ success: true, data: replays });
  }
}
