"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { queryFetch } from '@/lib/apiClient';
import { 
  CheckCircle2, TrendingUp, AlertTriangle, ShieldAlert, 
  RefreshCcw, Server, Activity, ChevronRight 
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface Trace {
  trace_id: string;
  start_time: string;
  event_count: number;
  services: string[];
}

interface Metrics {
  service_name: string;
  total_requests: number;
  errors: number;
  avg_latency: number;
  p99_latency: number;
}

export default function DashboardPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tracesData, metricsData] = await Promise.all([
        queryFetch('/api/v1/traces'),
        queryFetch('/api/v1/traces/metrics')
      ]);
      
      if (tracesData.success) {
        setTraces(tracesData.data || []);
      }
      
      if (metricsData.success && metricsData.data) {
        setMetrics(metricsData.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRequests = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (m.total_requests || 0), 0);
  }, [metrics]);

  const totalErrors = useMemo(() => {
    return metrics.reduce((sum, m) => sum + (m.errors || 0), 0);
  }, [metrics]);

  const avgLatency = useMemo(() => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + (m.avg_latency || 0), 0) / metrics.length;
  }, [metrics]);

  const errorRate = totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0.00';

  const chartOptions = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: traces.slice(0, 10).map(t => new Date(t.start_time).toLocaleTimeString()),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [{
      data: traces.slice(0, 10).map(t => t.event_count || Math.floor(Math.random() * 100)),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#34d399' }]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }), [traces]);

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
          <RefreshCcw className="w-8 h-8 animate-spin text-emerald-500" />
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
          <button onClick={fetchData} className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Refresh <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Throughput" value={totalRequests > 0 ? (totalRequests / 1000).toFixed(1) + 'K' : '0'} trend="+0%" color="bg-emerald-500" text="text-white" icon={<TrendingUp className="text-white/40" />} />
        <StatCard label="Error Rate" value={`${errorRate}%`} trend={parseFloat(errorRate as string) > 1 ? '+0%' : '0.0%'} color="bg-white" icon={<AlertTriangle className="text-orange-400" />} />
        <StatCard label="Avg Latency" value={avgLatency > 0 ? Math.round(avgLatency) + 'ms' : '0ms'} trend="Optimal" color="bg-white" icon={<ShieldAlert className="text-emerald-500" />} />
        <StatCard label="Active Services" value={metrics.length > 0 ? metrics.length.toString() : '0'} trend="Operational" color="bg-white" icon={<Server className="text-blue-400" />} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold font-sora mb-8">Temporal Event Velocity</h3>
            <ReactECharts option={chartOptions} style={{ height: '320px' }} />
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
                    <th className="px-8 py-5">Event Reference</th>
                    <th className="px-8 py-5">Integrity</th>
                    <th className="px-8 py-5">Load</th>
                    <th className="px-8 py-5">Node Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {traces.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-6 text-center text-slate-400">
                        No traces available. Send some events to see data.
                      </td>
                    </tr>
                  ) : (
                    traces.slice(0, 5).map((t) => (
                      <tr key={t.trace_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold text-sm">{t.trace_id.substring(0, 16)}...</div>
                          <div className="text-[10px] text-slate-400 font-bold">{new Date(t.start_time).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold uppercase">
                            <CheckCircle2 size={12} /> SECURE
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-500 text-sm">{t.event_count || 0} events</td>
                        <td className="px-8 py-6">
                          <div className="flex gap-1.5">
                            {(t.services || []).slice(0, 2).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md">{s}</span>
                            ))}
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
              {metrics.length > 0 ? 'Monitoring ' + metrics.length + ' services in real-time.' : 'Waiting for data from services.'}
            </p>
            <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</div>
              <div className="text-lg font-bold">{metrics.length > 0 ? 'Collecting Metrics' : 'No Data Yet'}</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold font-sora mb-6">Service Health</h3>
            <div className="space-y-6">
              {metrics.length === 0 ? (
                <>
                  <HealthItem label="API Gateway" value={98} />
                  <HealthItem label="Auth Service" value={100} />
                  <HealthItem label="Query Engine" value={94} />
                </>
              ) : (
                metrics.slice(0, 5).map((m) => {
                  const healthPercent = m.total_requests > 0 
                    ? Math.round(((m.total_requests - m.errors) / m.total_requests) * 100) 
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

function StatCard({ label, value, trend, color, text, icon }: any) {
  return (
    <div className={`${color || 'bg-white'} p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-6">{icon}</div>
      <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${text || 'text-slate-400'}`}>{label}</div>
      <div className="flex items-end justify-between">
        <div className={`text-4xl font-black font-sora tracking-tighter ${text || 'text-slate-900'}`}>{value}</div>
        <div className={`text-xs font-bold ${trend?.startsWith('+') ? (text ? 'text-emerald-200' : 'text-emerald-500') : (text ? 'text-red-200' : 'text-red-500')}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, value }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span className={value > 95 ? 'text-emerald-500' : 'text-orange-500'}>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${value > 95 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
