# Phase 6: Frontend Monitoring (Day 8)

## Objective
Replace hardcoded monitoring health data with real-time service health checks.

---

## Files to Modify

### `apps/frontend/src/app/monitoring/page.tsx` (Replace)

```typescript
"use client";

import { useEffect, useState } from "react";

interface ServiceHealth {
  name: string;
  port: number;
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  latency: number;
  checks: { [key: string]: { status: string; latency?: number } };
}

const SERVICES = [
  { name: "API Gateway", port: 3001 },
  { name: "Auth Service", port: 4000 },
  { name: "Log Service", port: 4001 },
  { name: "Query Service", port: 4002 },
  { name: "Alert Service", port: 5003 }
];

export default function MonitoringPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    async function checkServices() {
      const results = await Promise.all(
        SERVICES.map(async (service) => {
          try {
            const start = Date.now();
            const response = await fetch(`http://localhost:${service.port}/health`, {
              signal: AbortSignal.timeout(5000)
            });
            const latency = Date.now() - start;

            if (response.ok) {
              const data = await response.json();
              return {
                name: service.name,
                port: service.port,
                status: (data.status === "healthy" ? "healthy" : "degraded") as "healthy" | "degraded" | "unhealthy",
                version: data.version || "1.0.0",
                uptime: data.uptime || 0,
                latency,
                checks: data.checks || {}
              };
            }
            return {
              name: service.name,
              port: service.port,
              status: "unhealthy" as const,
              version: "unknown",
              uptime: 0,
              latency,
              checks: {}
            };
          } catch {
            return {
              name: service.name,
              port: service.port,
              status: "unhealthy" as const,
              version: "unknown",
              uptime: 0,
              latency: 0,
              checks: {}
            };
          }
        })
      );

      setServices(results);
      setLastUpdated(new Date());
      setLoading(false);
    }

    checkServices();
    const interval = setInterval(checkServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = services.every(s => s.status === "healthy")
    ? "healthy"
    : services.some(s => s.status === "unhealthy")
    ? "degraded"
    : "healthy";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            overallStatus === "healthy" ? "bg-green-500" : "bg-yellow-500"
          }`}></span>
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceHealthCard key={service.name} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceHealthCard({ service }: { service: ServiceHealth }) {
  const statusColors = {
    healthy: "bg-green-50 border-green-200",
    degraded: "bg-yellow-50 border-yellow-200",
    unhealthy: "bg-red-50 border-red-200"
  };

  const statusText = {
    healthy: "text-green-700",
    degraded: "text-yellow-700",
    unhealthy: "text-red-700"
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[service.status]}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            service.status === "healthy" ? "bg-green-500" :
            service.status === "degraded" ? "bg-yellow-500" : "bg-red-500"
          }`}></div>
          <div>
            <h3 className="font-bold">{service.name}</h3>
            <p className="text-sm text-gray-500">Port: {service.port} | Version: {service.version}</p>
          </div>
        </div>
        <div className={`font-bold ${statusText[service.status]}`}>
          {service.status.toUpperCase()}
        </div>
      </div>

      <div className="flex gap-6 mt-3 text-sm">
        <div>
          <span className="text-gray-500">Latency:</span>{" "}
          <span className="font-mono">{service.latency}ms</span>
        </div>
        <div>
          <span className="text-gray-500">Uptime:</span>{" "}
          <span>{formatUptime(service.uptime)}</span>
        </div>
      </div>

      {Object.keys(service.checks).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-sm">
            {Object.entries(service.checks).map(([name, check]) => (
              <div key={name} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  check.status === "ok" ? "bg-green-500" : "bg-red-500"
                }`}></span>
                <span className="text-gray-600 capitalize">{name}</span>
                {check.latency && (
                  <span className="text-gray-400 text-xs">({check.latency}ms)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### `apps/frontend/src/components/monitoring/ServiceHealthCard.tsx` (Optional extract)

```typescript
// Extract ServiceHealthCard component from page.tsx if needed
```

---

## Health Endpoint for All Services

Add to each service:

```typescript
// GET /health returns:
{
  status: "healthy" | "degraded" | "unhealthy",
  version: "1.0.0",
  uptime: 3600,
  timestamp: "2024-05-31T12:00:00.000Z",
  checks: {
    database: { status: "ok", latency: 5 },
    cache: { status: "ok", latency: 2 },
    queue: { status: "ok", latency: 10 }
  }
}
```

### Quick implementation:

```typescript
// Add to each service's app.ts
app.get("/health", async () => {
  const checks: any = {};
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Check database
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - start };
  } catch (error) {
    checks.database = { status: "error", error: "Database connection failed" };
    status = "degraded";
  }

  return {
    status,
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks
  };
});
```

---

## Verification Checklist

- [ ] Monitoring page fetches real health data
- [ ] All 5 services show correct status
- [ ] Auto-refresh every 10 seconds
- [ ] Error state handled gracefully
- [ ] No hardcoded health data remains

## Next Steps
Proceed to [07-traces-logs-frontend.md](./07-traces-logs-frontend.md)
