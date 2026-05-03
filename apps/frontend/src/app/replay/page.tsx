"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  RotateCcw, Play, History, CheckCircle2, 
  AlertCircle, ChevronRight, Zap, Loader2, Database
} from 'lucide-react';
import { queryFetch, apiFetch } from '@/lib/apiClient';
import TraceGraph from '@/components/TraceGraph';

export default function ReplayPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  const [originalTree, setOriginalTree] = useState<any[] | null>(null);
  const [replayTree, setReplayTree] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await queryFetch('/api/v1/traces/anomalies');
      if (data.success) setAnomalies(data.data);
    } catch (err) {
      console.error('Failed to fetch anomalies', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnomaly = async (anomaly: any) => {
    setSelectedAnomaly(anomaly);
    setReplayTree(null); // Clear previous replay
    try {
      const data = await queryFetch(`/api/v1/traces/${anomaly.trace_id}`);
      if (data.success) setOriginalTree(data.tree);
    } catch (err) {
      console.error('Failed to fetch original trace', err);
    }
  };

  const handleExecuteReplay = async () => {
    if (!selectedAnomaly) return;
    setExecuting(true);
    try {
      // Step 1: Tell API Gateway to replay the request
      const data = await apiFetch(`/api/v1/replay/${selectedAnomaly.trace_id}`, { method: 'POST' });
      
      if (data.success) {
        // Step 2: Fetch the new "replayed" trace tree
        // Note: In a real system, we'd wait a second for ingestion
        setTimeout(async () => {
          const replayData = await queryFetch(`/api/v1/traces/${data.replayTraceId}`);
          if (replayData.success) setReplayTree(replayData.tree);
          setExecuting(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Replay execution failed', err);
      setExecuting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Causality Replay</h2>
          <p className="text-slate-500 font-medium">Re-fire anomalous requests in isolated environments to verify fixes.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            View Replay History <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Anomalies List */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Anomalous Events</h4>
              <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-lg">LIVE FEED</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Scanning for failures...</span>
                </div>
              ) : anomalies.map((a) => (
                <div 
                  key={a.trace_id} 
                  onClick={() => handleSelectAnomaly(a)}
                  className={`p-8 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 relative group ${selectedAnomaly?.trace_id === a.trace_id ? 'bg-red-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(a.start_time).toLocaleTimeString()}</div>
                      <div className="text-xs font-bold text-red-600">Failed Request</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 mb-1 font-sora truncate">{a.service_name} Internal Error</div>
                  <div className="text-xs font-mono text-slate-400 truncate">{a.trace_id}</div>
                  {selectedAnomaly?.trace_id === a.trace_id && (
                    <div className="absolute right-8 bottom-8 text-emerald-500 animate-pulse">
                      <ChevronRight size={24} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Replay Workspace */}
        <div className="col-span-8">
          {!selectedAnomaly ? (
            <div className="h-[700px] bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-20">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <RotateCcw className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black font-sora mb-2">Select an anomaly to begin</h3>
              <p className="text-slate-400 max-w-xs">Select a failed request from the left panel to load its original causality graph and prepare for replay.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl">
                <div className="flex gap-8">
                  <div>
                    <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Target Service</div>
                    <div className="font-bold font-sora">{selectedAnomaly.service_name}</div>
                  </div>
                  <div className="border-l border-white/10 pl-8">
                    <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Isolation Mode</div>
                    <div className="font-bold font-sora">Shadow Proxy</div>
                  </div>
                </div>
                <button 
                  onClick={handleExecuteReplay}
                  disabled={executing}
                  className="px-10 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3"
                >
                  {executing ? <Loader2 className="animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  {executing ? 'Executing Shadow Replay...' : 'Execute Replay'}
                </button>
              </div>

              {/* Visualization Grids */}
              <div className="grid grid-cols-2 gap-6">
                {/* Original Trace */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 h-[600px] flex flex-col shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><History size={16} /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Original Request Flow</span>
                  </div>
                  <div className="flex-grow bg-slate-50/50 rounded-3xl border border-slate-50 relative overflow-hidden">
                    <TraceGraph tree={originalTree || []} />
                  </div>
                </div>

                {/* Replay Trace */}
                <div className={`bg-white rounded-[2.5rem] border-2 ${replayTree ? 'border-emerald-500/30' : 'border-dashed border-slate-200'} p-8 h-[600px] flex flex-col shadow-sm transition-all`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 ${replayTree ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'} rounded-lg transition-all`}><RotateCcw size={16} /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Replay Results</span>
                    {replayTree && <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-600 text-[8px] font-black rounded uppercase">Success</span>}
                  </div>
                  <div className="flex-grow bg-slate-50/50 rounded-3xl border border-slate-50 relative overflow-hidden flex items-center justify-center">
                    {executing ? (
                      <div className="flex flex-col items-center gap-4">
                        <Zap className="w-10 h-10 text-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Warming up nodes...</span>
                      </div>
                    ) : replayTree ? (
                      <TraceGraph tree={replayTree} />
                    ) : (
                      <div className="text-center p-10">
                        <Database className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">Execute a replay to see<br/>shadow results here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
