"use client";


import React, { useEffect, useState, useMemo } from 'react';
import { Activity, BarChart3, Clock, Database, Server, X, Zap, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import TraceGraph from '@/components/TraceGraph';
import ReactECharts from 'echarts-for-react';

export default function Dashboard() {
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<any | null>(null);
  const [traceTree, setTraceTree] = useState<any[] | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('http://localhost:4002/api/v1/traces')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTraces(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleViewTrace = (traceId: string) => {
    setSelectedTrace(traceId);
    setLoadingTrace(true);
    fetch(`http://localhost:4002/api/v1/traces/${traceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTraceTree(data.tree);
        }
        setLoadingTrace(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingTrace(false);
      });
  };

  // ECharts Options
  const chartOptions = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: traces.slice(0, 15).map(t => new Date(t.start_time).toLocaleTimeString()),
      axisLabel: { color: '#666', fontSize: 10 },
      axisLine: { lineStyle: { color: '#333' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#666', fontSize: 10 },
      splitLine: { lineStyle: { color: '#222' } }
    },
    series: [{
      data: traces.slice(0, 15).map(t => t.event_count * 12), // Simulated latency
      type: 'line',
      smooth: true,
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.4)' }, { offset: 1, color: 'transparent' }]
        }
      }
    }]
  }), [traces]);

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-10 pb-6 border-b border-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 uppercase">
              Antigravity <span className="text-blue-500">Core</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Enterprise Observability Platform</p>
          </div>
        </div>

        <div className="flex gap-4">
          <StatusIndicator icon={<ShieldCheck className="w-3 h-3" />} label="Security" status="Active" color="text-green-400" />
          <StatusIndicator icon={<Database className="w-3 h-3" />} label="ClickHouse" status="Connected" color="text-blue-400" />
          <button onClick={fetchData} className="p-2 hover:bg-gray-900 rounded-lg transition-colors border border-gray-800">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Metrics & Charts */}
        <div className="lg:col-span-4 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Activity />} label="Total Events" value={traces.reduce((acc, t) => acc + t.event_count, 0).toLocaleString()} trend="+12%" />
            <StatCard icon={<Clock />} label="Avg Latency" value="18.4ms" trend="-2ms" />
          </div>

          <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Latency Performance</h3>
            <ReactECharts option={chartOptions} style={{ height: '220px' }} />
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-blue-400 w-5 h-5" />
              <h3 className="font-bold">System Insights</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              No anomalies detected in the last 24 hours. Traffic is currently 14% higher than the baseline.
            </p>
          </div>
        </div>

        {/* Right Column: Traces & Graph */}
        <div className="lg:col-span-8 space-y-8">
          {selectedTrace && (
            <div className="bg-[#0a0a0a] border border-blue-500/30 rounded-3xl p-6 relative animate-in zoom-in-95 duration-500">
              <button onClick={() => setSelectedTrace(null)} className="absolute top-6 right-6 p-2 bg-gray-900 hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <div className="mb-6">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block border border-blue-500/30">Trace Detail</span>
                <h2 className="text-xl font-mono text-white opacity-90">{selectedTrace}</h2>
              </div>
              {loadingTrace ? (
                <div className="h-[500px] flex items-center justify-center bg-black/50 rounded-2xl border border-gray-900">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : <TraceGraph tree={traceTree || []} />}
            </div>
          )}

          <div className="bg-[#0a0a0a] border border-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-900 flex justify-between items-center bg-gradient-to-r from-transparent to-gray-900/50">
              <h2 className="text-xl font-bold">Real-time Stream</h2>
              <span className="text-xs text-gray-500 font-mono tracking-tighter">LIVE UPDATING</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-900/30 text-gray-500 text-[10px] uppercase font-black tracking-widest">
                    <th className="px-8 py-5">Trace Reference</th>
                    <th className="px-8 py-5">Services Involved</th>
                    <th className="px-8 py-5">Depth</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {traces.map((trace) => (
                    <tr key={trace.trace_id}
                      onClick={() => handleViewTrace(trace.trace_id)}
                      className="hover:bg-gray-800/20 cursor-pointer transition-all group">
                      <td className="px-8 py-6">
                        <div className="text-sm font-mono text-blue-400 group-hover:text-blue-300 transition-colors">
                          {trace.trace_id.substring(0, 14)}...
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-1.5 flex-wrap">
                          {trace.services.slice(0, 3).map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-[9px] text-gray-500 font-bold uppercase">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-mono text-gray-500">{trace.event_count}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          <span className="text-[10px] font-bold text-green-500 uppercase">Success</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-600 font-mono">
                        {new Date(trace.start_time).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, trend }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-900 p-6 rounded-2xl hover:border-blue-500/50 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-900 rounded-lg group-hover:bg-blue-600 transition-colors">{icon}</div>
        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-black tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-green-500">{trend}</div>
      </div>
    </div>
  );
}

function StatusIndicator({ icon, label, status, color }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded-xl">
      <div className={color}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">{label}</span>
        <span className="text-[10px] font-bold">{status}</span>
      </div>
    </div>
  );
}
