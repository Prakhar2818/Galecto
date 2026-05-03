"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Zap, Activity, Globe, Server, Cpu, Database } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Live Monitoring</h2>
          <p className="text-slate-500 font-medium">Sub-second telemetry updates via WebSocket pulse.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Live Flow Visualizer Placeholder */}
        <div className="col-span-12 lg:col-span-9">
           <div className="bg-slate-900 rounded-[3rem] p-12 h-[600px] relative overflow-hidden shadow-2xl shadow-emerald-500/10">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:40px_40px]" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-center items-center text-center">
                 <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30 animate-pulse">
                    <Zap className="w-12 h-12 text-emerald-500 fill-current" />
                 </div>
                 <h3 className="text-4xl font-black font-sora text-white mb-4 italic tracking-tighter">Connecting to Quantum Stream...</h3>
                 <p className="text-emerald-100/40 font-medium max-w-md">
                   Establishing high-velocity duplex connection to cluster nodes. Preparing real-time causality rendering.
                 </p>
                 
                 <div className="mt-20 grid grid-cols-3 gap-12 w-full max-w-3xl">
                    <MonitoringStat icon={<Server className="text-emerald-500" />} label="Clusters" value="08" />
                    <MonitoringStat icon={<Cpu className="text-emerald-500" />} label="CPU Usage" value="12%" />
                    <MonitoringStat icon={<Database className="text-emerald-500" />} label="IOPS" value="24.2k" />
                 </div>
              </div>

              {/* Decorative scanline */}
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 blur-md animate-scan z-20" />
           </div>
        </div>

        {/* Right: Node Status List */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Node Topology</h3>
           <div className="space-y-4">
              <NodeItem name="Node-Alpha-01" status="Active" load={14} />
              <NodeItem name="Node-Beta-02" status="Active" load={8} />
              <NodeItem name="Node-Gamma-03" status="Idle" load={2} />
              <NodeItem name="Node-Delta-04" status="Active" load={45} />
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MonitoringStat({ icon, label, value }: any) {
  return (
    <div className="flex flex-col items-center">
      <div className="p-3 bg-white/5 rounded-2xl mb-4 border border-white/10">{icon}</div>
      <div className="text-white text-2xl font-black font-sora mb-1 tracking-tighter">{value}</div>
      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function NodeItem({ name, status, load }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-sm font-bold text-slate-900">{name}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{status}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-black text-emerald-500">{load}%</div>
        <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
           <div className="h-full bg-emerald-500" style={{ width: `${load}%` }} />
        </div>
      </div>
    </div>
  );
}
