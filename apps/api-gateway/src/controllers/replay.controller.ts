import { FastifyRequest, FastifyReply } from "fastify";
import { clickhouse } from "../../../../packages/clickhouse/src/client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../../../packages/logger/src/logger";

export class ReplayController {
  
  async executeReplay(req: FastifyRequest, reply: FastifyReply) {
    const { traceId } = req.params as { traceId: string };

    try {
      // 1. Fetch original request metadata from ClickHouse
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
      const { method, url, headers, body } = originalPayload;

      // 2. Prepare the Replay Request
      const replayTraceId = `replay_${uuidv4()}`;
      
      logger.info({ 
        originalTraceId: traceId, 
        replayTraceId, 
        message: "Executing shadow replay" 
      });

      // 3. Re-fire the request
      // Note: We point to localhost:3001 (the gateway itself) or the service directly.
      // To simulate a full cycle, we send it through the gateway again but with a Replay header.
      try {
        const response = await axios({
          method,
          url: `http://localhost:3001${url}`,
          data: body,
          headers: {
            ...headers,
            'x-trace-id': replayTraceId,
            'x-original-trace-id': traceId,
            'x-galecto-replay': 'true'
          },
          validateStatus: () => true // Don't throw on 4xx/5xx
        });

        return reply.send({ 
          success: true, 
          replayTraceId, 
          originalTraceId: traceId,
          statusCode: response.status 
        });
      } catch (axiosError: any) {
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
}
