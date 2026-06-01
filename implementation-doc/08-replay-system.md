# Phase 8: Replay System (Day 10-11)

## Objective
Fix replay controller and build replay history UI.

---

## 8.1 Fix Replay Controller (Day 10)

### Files to Modify

#### `apps/api-gateway/src/controllers/replay.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { clickhouse } from "../../../../packages/clickhouse/src/client";
import { logger } from "../../../../packages/logger/src/logger";
import { replayProtection } from "../services/replay-protection";

const prisma = new PrismaClient();

export class ReplayController {
  async executeReplay(request: FastifyRequest<{ Params: { traceId: string } }>, reply: FastifyReply) {
    const organizationId = (request as any).organizationId;
    const { traceId } = request.params;

    try {
      // 1. Get original request from ClickHouse
      const originalEvents = await clickhouse.query({
        query: `
          SELECT * FROM events
          WHERE tenant_id = {tenantId:String}
          AND trace_id = {traceId:String}
          AND event_name LIKE 'API_REQUEST%'
          LIMIT 1
        `,
        query_params: { tenantId: organizationId, traceId }
      });

      if (!originalEvents.data || originalEvents.data.length === 0) {
        return reply.status(404).send({
          success: false,
          error: { code: "TRACE_NOT_FOUND", message: "Original trace not found" }
        });
      }

      const originalRequest = JSON.parse(originalEvents.data[0].payload as string);

      // 2. Create replay execution record
      const execution = await prisma.replayExecution.create({
        data: {
          organizationId,
          traceId,
          status: "RUNNING",
          requestMethod: originalRequest.method,
          requestUrl: originalRequest.url,
          requestHeaders: JSON.stringify(originalRequest.headers),
          requestBody: originalRequest.body,
          startTime: new Date()
        }
      });

      // 3. Prepare request (filter headers, mask PII)
      const targetUrl = originalRequest.url; // Use original URL, not hardcoded
      const filteredHeaders = this.filterHeaders(originalRequest.headers);
      const maskedBody = replayProtection.maskPii(originalRequest.body);

      // 4. Execute replay
      let response;
      try {
        response = await fetch(targetUrl, {
          method: originalRequest.method,
          headers: filteredHeaders,
          body: maskedBody
        });
      } catch (fetchError) {
        await prisma.replayExecution.update({
          where: { id: execution.id },
          data: {
            status: "FAILED",
            errorMessage: (fetchError as Error).message,
            completedAt: new Date()
          }
        });

        return reply.status(502).send({
          success: false,
          error: { code: "REPLAY_FAILED", message: (fetchError as Error).message }
        });
      }

      // 5. Get response
      const responseBody = await response.text();
      const maskedResponse = replayProtection.maskPii(responseBody);

      // 6. Update execution with results
      await prisma.replayExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          responseStatus: response.status,
          responseBody: maskedResponse,
          completedAt: new Date(),
          endTime: new Date()
        }
      });

      return reply.send({
        success: true,
        data: {
          executionId: execution.id,
          status: "COMPLETED",
          responseStatus: response.status,
          responseBody: maskedResponse
        }
      });

    } catch (error) {
      logger.error({ error, traceId }, "Replay execution failed");
      return reply.status(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Replay execution failed" }
      });
    }
  }

  async listReplays(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).organizationId;

    try {
      const executions = await prisma.replayExecution.findMany({
        where: { organizationId },
        orderBy: { executedAt: "desc" },
        take: 50
      });

      return reply.send({ success: true, data: executions });
    } catch (error) {
      logger.error({ error }, "Failed to list replay executions");
      return reply.status(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch replay history" }
      });
    }
  }

  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    const allowedHeaders = [
      "content-type",
      "accept",
      "user-agent",
      "x-request-id",
      "x-trace-id",
      "x-correlation-id",
      "accept-language"
    ];

    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}
```

---

## 8.2 Replay History UI (Day 11)

### `apps/frontend/src/app/replay/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

interface ReplayExecution {
  id: string;
  traceId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  requestMethod: string;
  requestUrl: string;
  responseStatus?: number;
  executedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function ReplayPage() {
  const [executions, setExecutions] = useState<ReplayExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = localStorage.getItem("ag_token");
        const response = await apiFetch("/api/v1/replays", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setExecutions(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch replay history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Replay History</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Run New Replay
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : executions.length === 0 ? (
        <div className="text-gray-500">No replay executions yet</div>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <ExecutionCard key={execution.id} execution={execution} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionCard({ execution }: { execution: ReplayExecution }) {
  const statusColors = {
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    RUNNING: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-gray-100 text-gray-800"
  };

  const duration = execution.completedAt
    ? new Date(execution.completedAt).getTime() - new Date(execution.executedAt).getTime()
    : null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono text-sm text-blue-600">{execution.traceId}</span>
          <div className="text-sm text-gray-500 mt-1">
            {execution.requestMethod} {execution.requestUrl}
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[execution.status]}`}>
          {execution.status}
        </span>
      </div>

      <div className="flex gap-4 mt-3 text-sm">
        <span>Executed: {new Date(execution.executedAt).toLocaleString()}</span>
        {execution.responseStatus && (
          <span>Response: {execution.responseStatus}</span>
        )}
        {duration && (
          <span>Duration: {duration}ms</span>
        )}
      </div>

      {execution.errorMessage && (
        <div className="mt-2 text-red-500 text-sm">
          Error: {execution.errorMessage}
        </div>
      )}

      <div className="mt-3">
        <button className="text-blue-500 text-sm hover:underline">
          View Details →
        </button>
      </div>
    </div>
  );
}
```

---

## Verification Checklist

- [ ] Replay executes successfully
- [ ] Replay history loads from database
- [ ] Status badges show correctly
- [ ] Duration calculated correctly
- [ ] Error messages displayed
- [ ] Empty state handled

## Next Steps
Proceed to [09-sdk-enhancement.md](./09-sdk-enhancement.md)
