"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { queryFetch, ApiError } from '@/lib/apiClient';
import {
  CheckCircle2, TrendingUp, AlertTriangle, ShieldAlert,
  RefreshCcw, Server, Activity, ChevronRight, X, AlertCircle
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface Trace {
  trace_id: string;
  start_time: string;
  event_count: number;
  services: string[];
  root_service?: string;
  status?: string;
  status_code?: number;
  endpoint?: string;
  display_name?: string;
}

interface Metrics {
  service_name: string;
  total_requests: number;
  errors: number;
  avg_latency: number;
  p99_latency: number;
}

interface ChartDataPoint {
  time: string;
  events: number;
  traceIds: string[];
  services: string[];
  statuses: number[];
}

interface AnomalySummary {
  totalAnomalies: number;
  affectedServicesCount: number;
  affectedServices: string[];
  criticalCount: number;
  warningCount: number;
  latencyCount: number;
  details: Array<{
    service: string;
    event: string;
    statusCode: number;
    count: number;
    avgLatency: number;
    lastOccurred: string;
    affectedTraces: string[];
  }>;
}

interface ErrorState {
  message: string;
  code?: string;
  retryable: boolean;
}

export default function DashboardPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [anomalySummary, setAnomalySummary] = useState<AnomalySummary | null>(null);
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchTraces = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const data = await queryFetch('/api/v1/traces', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        const traceData = data.data || [];

        const chartPoints: ChartDataPoint[] = traceData.slice(0, 10).map((t: Trace) => ({
          time: new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          events: t.event_count || 0,
          traceIds: [t.trace_id],
          services: t.services || [],
          statuses: t.status_code ? [t.status_code] : []
        }));

        setTraces(traceData);
        setChartData(chartPoints);
        setError(null);
      } else {
        if (isMountedRef.current) {
          setError({
            message: data.error?.message || 'Failed to load traces',
            code: data.error?.code,
            retryable: true
          });
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setError({
        message: apiError.message,
        code: apiError.code,
        retryable: apiError.status > 0 && apiError.status < 500
      });
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await queryFetch('/api/v1/traces/metrics', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success && data.data) {
        setMetrics(data.data);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Failed to fetch metrics:', err);
    }
  }, []);

  const fetchAnomalies = useCallback(async () => {
    try {
      const data = await queryFetch('/api/v1/traces/anomalies-summary', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success && data.data) {
        setAnomalySummary(data.data);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Failed to fetch anomaly summary:', err);
    }
  }, []);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    }

    await Promise.all([
      fetchTraces(isBackground),
      fetchMetrics(),
      fetchAnomalies()
    ]);

    if (!isMountedRef.current) return;
    if (!isBackground) setLoading(false);
    setRefreshing(false);
  }, [fetchTraces, fetchMetrics, fetchAnomalies]);

  useEffect(() => {
    isMountedRef.current = true;

    fetchData(false);

    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  const totalRequests = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (Number(m.total_requests) || 0), 0);
  }, [metrics]);

  const totalErrors = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (Number(m.errors) || 0), 0);
  }, [metrics]);

  const avgLatency = useMemo(() => {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + (Number(m.avg_latency) || 0), 0);
    return total / metrics.length;
  }, [metrics]);

  const errorRate = useMemo(() => {
    if (totalRequests === 0) return 0;
    return (totalErrors / totalRequests) * 100;
  }, [totalRequests, totalErrors]);

  const chartOptions = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#1e293b', fontSize: 12 },
      formatter: (params: any) => {
        const index = params[0]?.dataIndex;
        const point = chartData[index];
        if (!point) return params[0]?.name || '';
        
        const hasError = point.statuses?.some((s: number) => s >= 400);
        const statusDot = hasError ? '<span style="color:#ef4444">●</span>' : '<span style="color:#10b981">●</span>';
        
        let html = `<div style="font-weight:700;margin-bottom:6px;font-size:13px">${statusDot} ${point.time}</div>`;
        html += `<div style="margin-bottom:4px"><span style="color:#64748b">Events:</span> <b>${point.events}</b></div>`;
        
        if (point.services?.length > 0) {
          html += `<div style="margin-bottom:4px"><span style="color:#64748b">Services:</span> ${point.services.slice(0, 3).join(', ')}${point.services.length > 3 ? ' +' + (point.services.length - 3) : ''}</div>`;
        }
        
        if (point.traceIds?.length > 0) {
          html += `<div style="margin-bottom:4px"><span style="color:#64748b">Trace:</span> <span style="font-family:monospace;font-size:11px">${point.traceIds[0].substring(0, 12)}...</span></div>`;
        }
        
        if (point.statuses?.length > 0) {
          const statusCodes = point.statuses.filter((s: number) => s > 0);
          if (statusCodes.length > 0) {
            html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9"><span style="color:#64748b">Status:</span> ${statusCodes.join(', ')}</div>`;
          }
        }
        
        return html;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.time),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [{
      data: chartData.map(d => d.events),
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#10b981' },
            { offset: 1, color: '#34d399' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }), [chartData]);

  const handleRetry = () => {
    setError(null);
    fetchData(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black font-sora tracking-tight">System Health</h2>
            <p className="text-slate-500 font-medium">Loading metrics...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCcw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Fetching data from services...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">System Health</h2>
          <p className="text-slate-500 font-medium">Global operational overview across all cluster nodes.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            disabled={refreshing}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-red-700 font-medium text-sm">{error.message}</p>
            {error.code && <p className="text-red-500 text-xs mt-1">Error code: {error.code}</p>}
          </div>
          <div className="flex gap-2">
            {error.retryable && (
              <button
                onClick={handleRetry}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Throughput"
          value={totalRequests > 0 ? (totalRequests >= 1000 ? (totalRequests / 1000).toFixed(1) + 'K' : totalRequests.toString()) : '0'}
          trend={totalRequests > 0 ? 'Actual' : 'No data'}
          color="bg-emerald-500"
          text="text-white"
          icon={<TrendingUp className="text-white/40" />}
          subtitle="requests"
        />
        <StatCard
          label="Error Rate"
          value={`${errorRate.toFixed(2)}%`}
          trend={errorRate > 1 ? 'High' : 'Normal'}
          color="bg-white"
          icon={<AlertTriangle className={errorRate > 1 ? 'text-red-500' : 'text-orange-400'} />}
          subtitle={totalErrors > 0 ? `${totalErrors} errors` : undefined}
        />
        <StatCard
          label="Avg Latency"
          value={avgLatency > 0 ? `${Math.round(avgLatency)}ms` : '0ms'}
          trend={avgLatency > 500 ? 'High' : 'Optimal'}
          color="bg-white"
          icon={<ShieldAlert className={avgLatency > 500 ? 'text-red-500' : 'text-emerald-500'} />}
        />
        <StatCard
          label="Anomalies"
          value={anomalySummary?.totalAnomalies?.toString() || '0'}
          trend={anomalySummary?.totalAnomalies ? (anomalySummary.criticalCount > 0 ? 'Critical' : anomalySummary.warningCount > 0 ? 'Warning' : 'Low') : 'Normal'}
          color="bg-white"
          icon={<AlertCircle className={anomalySummary && anomalySummary.totalAnomalies > 0 ? 'text-red-500' : 'text-emerald-500'} />}
          subtitle={anomalySummary ? `${anomalySummary.affectedServicesCount} services affected` : undefined}
        />
      </div>

      {/* Anomaly Details Section */}
      {anomalySummary && anomalySummary.totalAnomalies > 0 && (
        <div className="mb-10 bg-white p-6 rounded-[2rem] shadow-sm border border-red-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold font-sora text-slate-900">Detected Anomalies</h3>
                <p className="text-xs text-slate-500">{anomalySummary.totalAnomalies} issues in the last 24 hours</p>
              </div>
            </div>
            <button
              onClick={() => setShowAnomalyDetails(!showAnomalyDetails)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              {showAnomalyDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          
          <div className="flex gap-4 mb-4">
            {anomalySummary.criticalCount > 0 && (
              <div className="px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                <div className="text-[10px] font-black uppercase text-red-400 tracking-widest">Critical</div>
                <div className="text-lg font-bold text-red-600">{anomalySummary.criticalCount}</div>
              </div>
            )}
            {anomalySummary.warningCount > 0 && (
              <div className="px-3 py-2 bg-orange-50 rounded-xl border border-orange-100">
                <div className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Warning</div>
                <div className="text-lg font-bold text-orange-600">{anomalySummary.warningCount}</div>
              </div>
            )}
            {anomalySummary.latencyCount > 0 && (
              <div className="px-3 py-2 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Latency</div>
                <div className="text-lg font-bold text-yellow-600">{anomalySummary.latencyCount}</div>
              </div>
            )}
          </div>
          
          {showAnomalyDetails && (
            <div className="space-y-3">
              {anomalySummary.details.slice(0, 5).map((detail, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      detail.statusCode >= 500 ? 'bg-red-500' : 
                      detail.statusCode >= 400 ? 'bg-orange-500' : 
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <div className="text-sm font-bold text-slate-900">{detail.service}</div>
                      <div className="text-[10px] text-slate-500">{detail.event} • {detail.statusCode > 0 ? `HTTP ${detail.statusCode}` : 'Latency Spike'} • {detail.count} occurrences</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {detail.avgLatency > 0 ? `${Math.round(detail.avgLatency)}ms` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold font-sora mb-8">Temporal Event Velocity</h3>
            {chartData.length > 0 ? (
              <ReactECharts option={chartOptions} style={{ height: '320px' }} />
            ) : (
              <div className="h-[320px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No trace data available</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold font-sora">Recent Activity Stream</h3>
              <Link href="/traces" className="text-emerald-500 font-bold text-xs flex items-center gap-1 hover:underline">
                View All Traces <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                    <th className="px-8 py-5">Trace ID</th>
                    <th className="px-8 py-5">Service</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Endpoint</th>
                    <th className="px-8 py-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {traces.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center">
                        <div className="text-slate-400">
                          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">No traces available</p>
                          <p className="text-xs mt-1">Send some events to see data here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    traces.slice(0, 5).map((t) => (
                      <tr key={t.trace_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-bold text-sm font-mono">{t.trace_id.substring(0, 16)}...</div>
                          <div className="text-[10px] text-slate-400 font-bold">{(t.event_count || 0).toLocaleString()} events</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-slate-700">
                            {t.root_service || (t.services || [])[0] || 'Unknown'}
                          </div>
                          {t.display_name && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{t.display_name}</div>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase ${
                            t.status === 'ERROR' ? 'bg-red-50 text-red-600' :
                            t.status === 'WARNING' ? 'bg-orange-50 text-orange-600' :
                            t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {t.status === 'ERROR' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                            {t.status || 'UNKNOWN'}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-mono text-slate-500 truncate max-w-[200px]">
                            {t.endpoint || '-'}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-[10px] text-slate-400 font-bold">
                            {new Date(t.start_time).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/30 rounded-full blur-3xl" />
            <Activity className="w-12 h-12 text-emerald-400 mb-8 opacity-50" />
            <h3 className="text-2xl font-black font-sora mb-4 leading-tight">Insight Engine Active.</h3>
            <p className="text-emerald-100/60 font-medium text-sm leading-relaxed mb-10">
              {metrics.length > 0
                ? `Monitoring ${metrics.length} service${metrics.length > 1 ? 's' : ''} in real-time.`
                : 'Waiting for data from services.'}
            </p>
            <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</div>
              <div className="text-lg font-bold">
                {metrics.length > 0 ? 'Collecting Metrics' : 'No Data Yet'}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold font-sora mb-6">Service Health</h3>
            <div className="space-y-6">
              {metrics.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Server className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No service metrics available</p>
                </div>
              ) : (
                metrics.slice(0, 5).map((m) => {
                  const healthPercent = m.total_requests > 0
                    ? Math.round(((Number(m.total_requests) - Number(m.errors)) / Number(m.total_requests)) * 100)
                    : 100;
                  return <HealthItem key={m.service_name} label={m.service_name} value={healthPercent} />;
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  color?: string;
  text?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

function StatCard({ label, value, trend, color, text, icon, subtitle }: StatCardProps) {
  return (
    <div className={`${color || 'bg-white'} p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-6">{icon}</div>
      <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${text || 'text-slate-400'}`}>{label}</div>
      <div className="flex items-end justify-between">
        <div className={`text-4xl font-black font-sora tracking-tighter ${text || 'text-slate-900'}`}>{value}</div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs font-medium ${text ? 'text-white/60' : 'text-slate-400'}`}>{subtitle || trend}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          trend === 'High' || trend === 'Critical'
            ? 'bg-red-100 text-red-600'
            : trend === 'Normal' || trend === 'Optimal' || trend === 'Actual'
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-slate-100 text-slate-500'
        }`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function HealthItem({ label, value }: { label: string; value: number }) {
  const isHealthy = value >= 95;
  const isWarning = value >= 80 && value < 95;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span className={isHealthy ? 'text-emerald-500' : isWarning ? 'text-orange-500' : 'text-red-500'}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}