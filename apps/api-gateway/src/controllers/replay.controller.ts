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
          SELECT payload, service_name 
          FROM events 
          WHERE trace_id = {traceId: String} 
            AND (tenant_id = {tenantId: String} OR tenant_id = 'anonymous')
            AND (event_name LIKE 'API_REQUEST%' OR event_name LIKE 'API_RESPONSE%')
          ORDER BY timestamp ASC
          LIMIT 1
        `,
        query_params: { traceId, tenantId: organizationId },
        format: 'JSONEachRow',
      });

      const row: any = await result.json();
      if (!row || row.length === 0) {
        return reply.status(404).send({ error: "Original request metadata not found" });
      }

      const originalPayload = JSON.parse(row[0].payload);
      const originalService = row[0].service_name || 'api-gateway';
      let { method, url, headers, body } = originalPayload;

      // Service URL mapping for replay
      const serviceUrlMap: Record<string, string> = {
        'api-gateway': `http://localhost:${process.env.PORT || 3001}`,
        'auth-service': 'http://localhost:4000',
        'log-service': 'http://localhost:4001',
        'query-service': 'http://localhost:4002',
        'alert-service': 'http://localhost:5003',
        'ngo-backend': 'http://localhost:3000',
        'ngo-frontend': 'http://localhost:3000',
      };

      // If URL is just a path, reconstruct full URL using service base URL
      if (url && url.startsWith('/')) {
        const baseUrl = serviceUrlMap[originalService] || `http://localhost:${process.env.PORT || 3001}`;
        url = `${baseUrl}${url}`;
      } else if (url && (url.startsWith('http://localhost/') || url.startsWith('http://localhost:80/'))) {
        // Fix URLs that have localhost without the correct port
        const baseUrl = serviceUrlMap[originalService] || `http://localhost:${process.env.PORT || 3001}`;
        url = url.replace(/^http:\/\/localhost(:80)?\//, `${baseUrl}/`);
      }

      const urlValidation = replayProtection.validateTargetUrl(url);
      if (!urlValidation.valid) {
        return reply.status(400).send({ error: urlValidation.error });
      }
      // Use normalized URL in case the stored URL was missing protocol
      url = urlValidation.normalizedUrl || url;

      headers = replayProtection.filterHeaders(headers || {});
      
      // Safely handle body: only parse/mask if present and method typically uses body
      const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];
      const shouldSendBody = methodsWithBody.includes((method || 'GET').toUpperCase()) && body !== undefined && body !== null;
      
      let processedBody = null;
      if (shouldSendBody) {
        try {
          if (typeof body === 'string') {
            body = JSON.parse(body);
          }
        } catch {
          // If body is not valid JSON, keep as string
        }
        body = replayProtection.maskPii(body);
        body = replayProtection.redactSensitiveFields(body);
        processedBody = body;
      }

      const replayExecution = await prisma.replayExecution.create({
        data: {
          traceId,
          organizationId,
          status: 'RUNNING',
          requestMethod: method,
          requestUrl: url,
          requestHeaders: JSON.stringify(headers),
          requestBody: processedBody ? JSON.stringify(processedBody) : null,
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
        const outgoingHeaders: any = {
          ...headers,
          'x-trace-id': replayTraceId,
          'x-original-trace-id': traceId,
          'x-galecto-replay': 'true',
          'x-galecto-organization-id': organizationId,
        };

        // Strip content-type and content-length if no body is being sent
        // to prevent "Body cannot be empty" errors on the target service
        if (!shouldSendBody || processedBody === null) {
          delete outgoingHeaders['content-type'];
          delete outgoingHeaders['content-length'];
        }

        const axiosConfig: any = {
          method,
          url: url,
          headers: outgoingHeaders,
          validateStatus: () => true
        };

        // Only attach data if body is present and method supports it
        if (shouldSendBody && processedBody !== null) {
          axiosConfig.data = processedBody;
        }

        logger.info({ 
          replayId: replayExecution.id,
          method, 
          url, 
          hasBody: !!processedBody,
          headers: Object.keys(outgoingHeaders),
          message: "Replaying request" 
        });

        // Validate URL is not empty before axios call
        if (!url) {
          throw new Error('URL is empty after normalization');
        }

        const response = await axios(axiosConfig);

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
        const errorDetails = {
          message: axiosError?.message || 'Unknown error',
          code: axiosError?.code || 'NO_CODE',
          status: axiosError?.response?.status,
          url: axiosError?.config?.url || url,
          method: axiosError?.config?.method || method,
          stack: axiosError?.stack,
        };

        logger.error({ 
          replayId: replayExecution.id,
          error: errorDetails,
          message: "Replay request failed" 
        });

        await prisma.replayExecution.update({
          where: { id: replayExecution.id },
          data: {
            status: 'FAILED',
            errorMessage: JSON.stringify(errorDetails),
            completedAt: new Date()
          }
        });

        return reply.status(500).send({ 
          error: "Failed to re-fire request", 
          details: errorDetails
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
