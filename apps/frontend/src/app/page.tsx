"use client";

import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, Clock, Database, Server, X } from 'lucide-react';
import TraceGraph from '@/components/TraceGraph';

export default function Dashboard() {
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<any | null>(null);
  const [traceTree, setTraceTree] = useState<any[] | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  useEffect(() => {
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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Observability Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Enterprise Telemetry & Distributed Tracing</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
            <Server className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Log Service: Online</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">ClickHouse: Active</span>
          </div>
        </div>
      </header>

      {/* Trace Detail Modal/Section */}
      {selectedTrace && (
        <div className="mb-12 bg-gray-900/80 border-2 border-blue-500/30 rounded-2xl p-6 relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button 
            onClick={() => setSelectedTrace(null)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="mb-6">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Causality Graph</h2>
            <p className="text-xl font-mono truncate max-w-[80%]">{selectedTrace}</p>
          </div>

          {loadingTrace ? (
            <div className="h-[400px] flex items-center justify-center bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-gray-500 animate-pulse">Stitching trace causality from ClickHouse...</span>
            </div>
          ) : traceTree ? (
            <TraceGraph tree={traceTree} />
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-gray-950 rounded-xl border border-gray-800">
              <span className="text-red-400">Failed to reconstruct trace tree</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Activity className="text-blue-400" />} label="Total Traces" value={traces.length.toString()} />
        <StatCard icon={<Clock className="text-purple-400" />} label="Avg. Latency" value="24ms" />
        <StatCard icon={<BarChart3 className="text-green-400" />} label="Throughput" value="1.2k req/s" />
        <StatCard icon={<Server className="text-yellow-400" />} label="Active Services" value="4" />
      </div>

      {/* Trace Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold">Recent Distributed Traces</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Trace ID</th>
                <th className="px-6 py-4 font-medium">Start Time</th>
                <th className="px-6 py-4 font-medium">Services</th>
                <th className="px-6 py-4 font-medium">Events</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading traces...</td>
                </tr>
              ) : traces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No traces found in ClickHouse</td>
                </tr>
              ) : (
                traces.map((trace) => (
                  <tr key={trace.trace_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-300">{trace.trace_id.substring(0, 18)}...</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{new Date(trace.start_time).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {trace.services.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{trace.event_count}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewTrace(trace.trace_id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                      >
                        View Graph
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>
        <span className="text-gray-400 text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
