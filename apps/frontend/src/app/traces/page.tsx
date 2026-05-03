"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TraceGraph from '@/components/TraceGraph';
import { Activity, RefreshCw, X, ChevronRight, Search, Filter } from 'lucide-react';

export default function TracesPage() {
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
        if (data.success) setTraces(data.data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewTrace = (traceId: string) => {
    setSelectedTrace(traceId);
    setLoadingTrace(true);
    fetch(`http://localhost:4002/api/v1/traces/${traceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTraceTree(data.tree);
        setLoadingTrace(false);
      })
      .catch(err => setLoadingTrace(false));
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Request Tracing</h2>
          <p className="text-slate-500 font-medium">Reconstruct hierarchical causality across your distributed stack.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Refresh Stream <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Trace List */}
        <div className={`${selectedTrace ? 'col-span-4' : 'col-span-12'} transition-all duration-500`}>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Ingestion</span>
              </div>
              <Filter size={16} className="text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors" />
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              {traces.map((t) => (
                <div 
                  key={t.trace_id} 
                  onClick={() => handleViewTrace(t.trace_id)}
                  className={`p-8 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 group relative ${selectedTrace === t.trace_id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors font-mono tracking-tighter">
                      {t.trace_id.substring(0, 20)}...
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">{new Date(t.start_time).toLocaleTimeString()}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {t.services.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-white border border-slate-100 text-[8px] font-black uppercase rounded-md text-slate-500">{s}</span>
                      ))}
                    </div>
                    <div className="text-xs font-bold text-slate-400">{t.event_count} spans</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Trace Visualization */}
        {selectedTrace && (
          <div className="col-span-8 animate-in slide-in-from-right-10 duration-700">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100 h-[800px] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-black font-sora">Causality Tree</h3>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Trace Root: {selectedTrace.substring(0, 12)}</p>
                  </div>
                  <button onClick={() => setSelectedTrace(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-100">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="flex-grow bg-slate-50/50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                   {loadingTrace ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-20">
                         <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Stitching spans...</span>
                         </div>
                      </div>
                   ) : <TraceGraph tree={traceTree || []} />}
                </div>

                <div className="mt-8 flex gap-4">
                   <div className="flex-grow p-6 bg-emerald-500 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-emerald-500/20">
                      <div>
                        <div className="text-[10px] font-black uppercase opacity-60">Anomaly Status</div>
                        <div className="text-lg font-bold">No Bottlenecks Detected</div>
                      </div>
                      <Activity className="w-8 h-8 opacity-40" />
                   </div>
                   <button className="px-8 py-6 bg-slate-900 text-white font-bold rounded-3xl hover:bg-slate-800 transition-colors">
                      Run Replay
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
