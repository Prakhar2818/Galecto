# Phase 7: Traces & Logs Frontend (Day 9)

## Objective
Build real traces and logs explorer pages using actual data from query service.

---

## Files to Modify

### `apps/frontend/src/app/traces/page.tsx` (Replace)

```typescript
"use client";

import { useEffect, useState } from "react";
import { queryFetch } from "@/lib/queryClient";

interface Trace {
  traceId: string;
  startTime: string;
  endTime: string;
  eventCount: number;
  services: string[];
}

export default function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTraces() {
      try {
        const token = localStorage.getItem("ag_token");
        const response = await queryFetch("/api/v1/traces", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTraces(data.data || []);
        } else {
          setError("Failed to fetch traces");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchTraces();
    const interval = setInterval(fetchTraces, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6">Loading traces...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Distributed Traces</h1>
        <span className="text-sm text-gray-500">{traces.length} traces found</span>
      </div>

      {traces.length === 0 ? (
        <div className="text-gray-500">No traces found. Send some telemetry first!</div>
      ) : (
        <div className="space-y-2">
          {traces.map((trace) => (
            <TraceCard key={trace.traceId} trace={trace} />
          ))}
        </div>
      )}
    </div>
  );
}

function TraceCard({ trace }: { trace: Trace }) {
  const duration = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime();

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-mono text-sm text-blue-600">{trace.traceId}</div>
          <div className="text-sm text-gray-500 mt-1">
            {new Date(trace.startTime).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">{duration}ms</div>
          <div className="text-xs text-gray-500">{trace.eventCount} events</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {trace.services.map((service, i) => (
          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
            {service}
          </span>
        ))}
      </div>

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

### `apps/frontend/src/app/logs/page.tsx` (Replace)

```typescript
"use client";

import { useEffect, useState } from "react";
import { queryFetch } from "@/lib/queryClient";

interface LogEntry {
  timestamp: string;
  service: string;
  event_name: string;
  payload: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    service: "",
    level: "",
    search: ""
  });

  useEffect(() => {
    async function fetchLogs() {
      try {
        const token = localStorage.getItem("ag_token");
        const params = new URLSearchParams();
        if (filters.service) params.append("service", filters.service);
        if (filters.level) params.append("level", filters.level);
        if (filters.search) params.append("search", filters.search);

        const response = await queryFetch(`/api/v1/logs?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLogs(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [filters]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Log Explorer</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="border p-2 rounded"
          value={filters.service}
          onChange={(e) => setFilters({...filters, service: e.target.value})}
        >
          <option value="">All Services</option>
          <option value="api-gateway">API Gateway</option>
          <option value="auth-service">Auth Service</option>
          <option value="log-service">Log Service</option>
          <option value="query-service">Query Service</option>
          <option value="alert-service">Alert Service</option>
        </select>

        <select
          className="border p-2 rounded"
          value={filters.level}
          onChange={(e) => setFilters({...filters, level: e.target.value})}
        >
          <option value="">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>

        <input
          type="text"
          placeholder="Search logs..."
          className="border p-2 rounded flex-1"
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setFilters({ service: "", level: "", search: "" })}
        >
          Clear
        </button>
      </div>

      {/* Log Table */}
      {loading ? (
        <div>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500">No logs found</div>
      ) : (
        <div className="font-mono text-sm">
          <div className="grid grid-cols-[200px_150px_150px_1fr] gap-2 font-bold border-b pb-2 mb-2">
            <div>Time</div>
            <div>Service</div>
            <div>Event</div>
            <div>Payload</div>
          </div>

          {logs.map((log, i) => (
            <LogRow key={i} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  const getLevelColor = (eventName: string) => {
    const lower = eventName.toLowerCase();
    if (lower.includes("error")) return "text-red-600";
    if (lower.includes("warn")) return "text-yellow-600";
    if (lower.includes("debug")) return "text-gray-400";
    return "text-green-600";
  };

  const payload = typeof log.payload === "string" ? log.payload : JSON.stringify(log.payload);
  const isJson = payload.startsWith("{");

  return (
    <div className="border-b py-2">
      <div className="grid grid-cols-[200px_150px_150px_1fr] gap-2">
        <div className="text-gray-500 text-xs">
          {new Date(log.timestamp).toLocaleString()}
        </div>
        <div className="text-blue-600">{log.service}</div>
        <div className={getLevelColor(log.event_name)}>{log.event_name}</div>
        <div className="truncate">
          {isJson ? (
            <button
              className="text-blue-500 hover:underline text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "▼ Collapse" : "▶ Expand JSON"}
            </button>
          ) : (
            payload
          )}
        </div>
      </div>

      {expanded && isJson && (
        <div className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
          <pre className="text-xs">{JSON.stringify(JSON.parse(payload), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Verification Checklist

- [ ] Traces page loads real trace data
- [ ] Logs page loads real log data
- [ ] Service filter works
- [ ] Level filter works
- [ ] Search works
- [ ] JSON expand/collapse works
- [ ] Auto-refresh (traces every 15s)
- [ ] Empty state handled gracefully

## Next Steps
Proceed to [08-replay-system.md](./08-replay-system.md)
