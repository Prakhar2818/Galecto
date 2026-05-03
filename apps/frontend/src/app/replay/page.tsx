"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { RotateCcw, Play, History, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ReplayPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Causality Replay</h2>
          <p className="text-slate-500 font-medium">Re-run failed transactions to isolate state-dependent bugs.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Replay History <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Failed Requests List */}
        <div className="col-span-4 space-y-6">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Anomalous Requests</h3>
           <div className="space-y-4">
              <ReplayItem id="req_98b50e" service="api-gateway" status="500 Error" />
              <ReplayItem id="req_22c110" service="auth-service" status="Timeout" active />
              <ReplayItem id="req_88f20a" service="billing-service" status="DB Connection" />
           </div>
        </div>

        {/* Right: Replay Workspace */}
        <div className="col-span-8 space-y-8">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <RotateCcw size={120} />
              </div>
              
              <div className="flex justify-between items-center mb-12 relative z-10">
                 <div>
                    <h3 className="text-2xl font-black font-sora">Replay Session</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">Target: req_22c110 (Auth Service)</p>
                 </div>
                 <button className="btn-primary !rounded-full !py-4 !px-10 flex items-center gap-3 shadow-2xl shadow-emerald-500/40">
                    Execute Replay <Play className="w-5 h-5 fill-current" />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-8 relative z-10">
                 {/* Original Result */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <AlertCircle size={14} className="text-red-500" /> Original Result
                    </label>
                    <pre className="p-6 bg-slate-900 rounded-3xl text-[11px] font-mono text-red-400 overflow-x-auto h-64 shadow-inner">
{`{
  "status": 500,
  "error": "Timeout",
  "service": "auth-service",
  "context": "database_handshake"
}`}
                    </pre>
                 </div>

                 {/* Replay Result */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-emerald-500" /> Replay Simulation
                    </label>
                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-64 flex items-center justify-center text-center">
                       <div className="max-w-xs">
                          <p className="text-xs font-bold text-slate-400 leading-relaxed">
                             Click "Execute Replay" to simulate the request environment and capture fresh telemetry.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-10 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <Zap size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black font-sora text-emerald-900">Isolation Mode Enabled</h4>
                    <p className="text-xs font-medium text-emerald-600">Replay will use captured request context headers.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ReplayItem({ id, service, status, active }: any) {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all cursor-pointer group ${active ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`font-mono text-sm font-bold ${active ? 'text-emerald-600' : 'text-slate-900'}`}>{id}</div>
        <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${status.includes('Error') ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
          {status}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{service}</span>
        <ArrowRight size={14} className={`transition-transform group-hover:translate-x-1 ${active ? 'text-emerald-500' : 'text-slate-300'}`} />
      </div>
    </div>
  );
}
