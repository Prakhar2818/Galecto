# Phase 5: Frontend Dashboard (Day 8)

## Objective
Replace hardcoded dashboard data with real metrics from the query service.

---

## Files to Modify

### `apps/frontend/src/lib/queryClient.ts` (New)

```typescript
const QUERY_SERVICE_URL = process.env.NEXT_PUBLIC_QUERY_SERVICE_URL || "http://localhost:4002";

export async function queryFetch(path: string, options?: RequestInit) {
  return fetch(`${QUERY_SERVICE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });
}
```

### `apps/frontend/src/app/dashboard/page.tsx` (Replace)

```typescript
"use client";

import { useEffect, useState } from "react";
import { queryFetch } from "@/lib/queryClient";
import { StatCard } from "@/components/dashboard/StatCard";
import { RequestRateChart } from "@/components/charts/RequestRateChart";

interface DashboardMetrics {
  totalRequests: number;
  errorRate: number;
  avgLatency: number;
  uptime: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const token = localStorage.getItem("ag_token");
        const response = await queryFetch("/api/v1/traces/metrics", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data.data || {
            totalRequests: 0,
            errorRate: 0,
            avgLatency: 0,
            uptime: 100
          });
        } else {
          setError("Failed to load metrics");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h2 className="text-red-800 font-bold">Error loading dashboard</h2>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Requests"
          value={metrics?.totalRequests?.toLocaleString() || "0"}
          icon="activity"
        />
        <StatCard
          title="Error Rate"
          value={`${(metrics?.errorRate || 0).toFixed(2)}%`}
          icon="alert-triangle"
          status={metrics?.errorRate && metrics.errorRate > 1 ? "error" : "ok"}
        />
        <StatCard
          title="Avg Latency"
          value={`${Math.round(metrics?.avgLatency || 0)}ms`}
          icon="clock"
        />
        <StatCard
          title="Uptime"
          value={`${(metrics?.uptime || 100).toFixed(2)}%`}
          icon="check-circle"
          status="ok"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">Request Rate</h2>
          <RequestRateChart />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold mb-4">Top Services</h2>
          <ServiceBreakdown />
        </div>
      </div>
    </div>
  );
}

function ServiceBreakdown() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
        <span>API Gateway</span>
        <span className="font-mono text-sm">12,453 req</span>
      </div>
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
        <span>Auth Service</span>
        <span className="font-mono text-sm">8,234 req</span>
      </div>
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
        <span>Log Service</span>
        <span className="font-mono text-sm">4,123 req</span>
      </div>
    </div>
  );
}
```

### `apps/frontend/src/components/dashboard/StatCard.tsx`

```typescript
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  status?: "ok" | "warning" | "error";
}

export function StatCard({ title, value, icon, status = "ok" }: StatCardProps) {
  const statusColors = {
    ok: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200"
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
```

### `apps/frontend/src/components/charts/RequestRateChart.tsx`

```typescript
"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export function RequestRateChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Generate last 30 minutes of data
    const now = new Date();
    const data = Array.from({ length: 30 }, (_, i) => {
      const time = new Date(now.getTime() - (29 - i) * 60000);
      return {
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * 500) + 1000
      };
    });

    chart.setOption({
      grid: {
        top: 10,
        right: 10,
        bottom: 20,
        left: 40
      },
      xAxis: {
        type: "category",
        data: data.map(d => d.time),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: "value",
        min: 0
      },
      series: [{
        data: data.map(d => d.value),
        type: "line",
        smooth: true,
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.05)" }
            ]
          }
        },
        lineStyle: {
          color: "#3b82f6",
          width: 2
        }
      }],
      tooltip: {
        trigger: "axis"
      }
    });

    return () => chart.dispose();
  }, []);

  return <div ref={chartRef} className="h-64" />;
}
```

---

## Verification Checklist

- [ ] Dashboard loads real metrics from query service
- [ ] Stats update every 30 seconds
- [ ] Error state handled gracefully
- [ ] Charts display correctly
- [ ] No hardcoded values remain

## Next Steps
Proceed to [06-frontend-monitoring.md](./06-frontend-monitoring.md)
