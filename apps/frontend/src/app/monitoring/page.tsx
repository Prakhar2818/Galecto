"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Activity, Globe, Cpu, Server, Loader2, AlertCircle, CheckCircle2, Zap, RefreshCw, X } from 'lucide-react';
import { queryFetch, ApiError } from '@/lib/apiClient';

interface ServiceMetrics {
  service_name: string;
  total_requests: number;
  errors: number;
  avg_latency: number;
  p99_latency: number;
}

interface GlobalStats {
  globalTraffic: number;
  errorRate: number;
  avgLatency: number;
}

interface ErrorState {
  message: string;
  code?: string;
  retryable: boolean;
}

function MonitoringContent() {
  const [metrics, setMetrics] = useState<ServiceMetrics[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchMetrics = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const data = await queryFetch('/api/v1/traces/metrics', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success && data.data) {
        const services = Array.isArray(data.data) ? data.data : [];
        setMetrics(services);

        const totalRequests = services.reduce((sum: number, m: ServiceMetrics) =>
          sum + (Number(m.total_requests) || 0), 0);

        const totalErrors = services.reduce((sum: number, m: ServiceMetrics) =>
          sum + (Number(m.errors) || 0), 0);

        const avgLatency = services.length > 0
          ? services.reduce((sum: number, m: ServiceMetrics) =>
              sum + (Number(m.avg_latency) || 0), 0) / services.length
          : 0;

        const errorRate = totalRequests > 0
          ? parseFloat(((totalErrors / totalRequests) * 100).toFixed(2))
          : 0;

        setGlobalStats({
          globalTraffic: totalRequests,
          errorRate,
          avgLatency: Math.round(avgLatency)
        });

        setError(null);
      } else {
        setError({
          message: data.error?.message || 'Failed to load metrics',
          code: data.error?.code,
          retryable: true
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setError({
        message: apiError.message,
        code: apiError.code,
        retryable: apiError.status > 0 && apiError.status < 500
      });
    } finally {
      if (!isMountedRef.current) return;
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    await fetchMetrics(isBackground);
    if (!isBackground) setLoading(false);
    setRefreshing(false);
  }, [fetchMetrics]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData(false);

    intervalRef.current = setInterval(() => {
      if (!loading) {
        fetchData(true);
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, loading]);

  const handleRetry = () => {
    setError(null);
    fetchData(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Application Dashboard</h2>
          <p className="text-slate-500 font-medium">Real-time metrics from your connected application.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setRefreshing(true); fetchData(true); }}
            disabled={refreshing || loading}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-red-700 font-medium text-sm">{error.message}</p>
          </div>
          <div className="flex gap-2">
            {error.retryable && (
              <button onClick={handleRetry} className="text-xs text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            )}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl h-[600px] flex flex-col">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="relative z-10 flex justify-between items-center mb-12">
              <div>
                <h3 className="text-2xl font-black font-sora text-white">Service Metrics</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Data</span>
                </div>
              </div>
              <Activity className="text-white/20 w-12 h-12" />
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto pr-4 custom-scrollbar">
              {loading && metrics.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                </div>
              ) : metrics.length === 0 && !error ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Server className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No services connected</p>
                    <p className="text-xs text-slate-500 mt-2">Connect your application to see metrics</p>
                  </div>
                </div>
              ) : (
                metrics.map((m, i) => {
                  const errorRate = Number(m.total_requests) > 0
                    ? ((Number(m.errors) / Number(m.total_requests)) * 100).toFixed(2)
                    : '0.00';
                  
                  return (
                    <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md flex items-center gap-8 group hover:bg-white/10 transition-all">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        Number(m.errors) > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Server size={24} />
                      </div>
                      <div className="flex-grow">
                        <div className="text-white font-bold font-sora">{m.service_name || 'Unknown Service'}</div>
                        <div className="text-xs text-white/40 font-medium">
                          {Number(m.total_requests).toLocaleString()} total requests
                        </div>
                      </div>
                      <div className="text-right flex gap-12">
                        <div>
                          <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">Requests</div>
                          <div className="text-white font-bold">{formatNumber(Number(m.total_requests) || 0)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">Avg Latency</div>
                          <div className="text-emerald-400 font-bold">{Math.round(Number(m.avg_latency) || 0)}ms</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">P99 Latency</div>
                          <div className="text-white font-bold">{Math.round(Number(m.p99_latency) || 0)}ms</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">Errors</div>
                          <div className={`font-bold ${Number(m.errors) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {Number(m.errors) || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">Error Rate</div>
                          <div className={`font-bold ${Number(m.errors) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {errorRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-6">
          {globalStats ? (
            <>
              <StatCard
                icon={<Globe />}
                title="Total Traffic"
                value={formatNumber(globalStats.globalTraffic)}
                unit="requests"
                color="bg-blue-500"
              />
              <StatCard
                icon={<Cpu />}
                title="Error Rate"
                value={globalStats.errorRate.toString()}
                unit="%"
                color={globalStats.errorRate > 5 ? 'bg-red-500' : 'bg-emerald-500'}
              />
              <StatCard
                icon={<Zap />}
                title="Avg Latency"
                value={globalStats.avgLatency.toString()}
                unit="ms"
                color="bg-orange-500"
              />
            </>
          ) : (
            <>
              <StatCard icon={<Globe />} title="Total Traffic" value="-" unit="requests" color="bg-blue-500" />
              <StatCard icon={<Cpu />} title="Error Rate" value="-" unit="%" color="bg-emerald-500" />
              <StatCard icon={<Zap />} title="Avg Latency" value="-" unit="ms" color="bg-orange-500" />
            </>
          )}

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
            <h4 className="text-sm font-black font-sora uppercase tracking-widest text-slate-400 mb-6">Application Health</h4>
            <div className="space-y-4">
              {metrics.length === 0 ? (
                <div className="text-center text-slate-400 py-4">
                  <p className="text-sm">No services</p>
                </div>
              ) : (
                metrics.map((m) => {
                  const errorRate = Number(m.total_requests) > 0
                    ? (Number(m.errors) / Number(m.total_requests)) * 100
                    : 0;
                  const avgLatency = Number(m.avg_latency) || 0;
                  
                  // Calculate health status
                  let healthStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline' = 'Healthy';
                  let healthColor = 'bg-emerald-100 text-emerald-600';
                  let healthIcon = <CheckCircle2 className="w-3 h-3" />;
                  
                  if (errorRate > 5 || avgLatency > 500) {
                    healthStatus = 'Critical';
                    healthColor = 'bg-red-100 text-red-600';
                    healthIcon = <AlertCircle className="w-3 h-3" />;
                  } else if (errorRate > 1 || avgLatency > 200) {
                    healthStatus = 'Warning';
                    healthColor = 'bg-orange-100 text-orange-600';
                    healthIcon = <AlertCircle className="w-3 h-3" />;
                  } else if (Number(m.total_requests) === 0) {
                    healthStatus = 'Offline';
                    healthColor = 'bg-slate-100 text-slate-600';
                    healthIcon = <Server className="w-3 h-3" />;
                  }
                  
                  return (
                    <div key={m.service_name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                          {m.service_name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {errorRate.toFixed(1)}% errors • {Math.round(avgLatency)}ms
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 ${healthColor}`}>
                        {healthIcon}
                        {healthStatus}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, title, value, unit, color }: { icon: React.ReactNode; title: string; value: string; unit: string; color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl text-white ${color} shadow-lg shadow-current/20`}>
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black font-sora">{value}</span>
          <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black font-sora tracking-tight">Application Dashboard</h2>
            <p className="text-slate-500 font-medium">Real-time metrics from your connected application.</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <MonitoringContent />
    </Suspense>
  );
}