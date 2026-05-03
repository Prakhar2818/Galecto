"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Bell, AlertTriangle, CheckCircle2, Clock, Filter, Plus } from 'lucide-react';

export default function AlertsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">System Alerts</h2>
          <p className="text-slate-500 font-medium">Real-time threshold monitoring and incident history.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20">
            Create Rule <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Active Alerts */}
        <div className="col-span-8 space-y-6">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Active Incidents</h3>
           <div className="space-y-4">
              <AlertCard 
                title="P99 Latency Spike" 
                desc="Service 'billing-service' exceeds 500ms latency threshold." 
                severity="CRITICAL" 
                time="2 mins ago"
                color="bg-red-500"
              />
              <AlertCard 
                title="Elevated Error Rate" 
                desc="Auth Service returning 5xx errors for /v1/validate." 
                severity="WARNING" 
                time="15 mins ago"
                color="bg-orange-500"
              />
           </div>

           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 pt-8">Resolved History</h3>
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                    <th className="px-8 py-5">Alert Rule</th>
                    <th className="px-8 py-5">Resolution</th>
                    <th className="px-8 py-5">Duration</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   <ResolvedRow title="Memory Leak" res="Auto-scaled" dur="12m" />
                   <ResolvedRow title="CPU Throttling" res="Manual Restart" dur="4m" />
                   <ResolvedRow title="DB Connectivity" res="Fixed" dur="45m" />
                </tbody>
              </table>
           </div>
        </div>

        {/* Rules Summary */}
        <div className="col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="font-bold font-sora mb-6">Monitoring Rules</h3>
              <div className="space-y-4">
                 <RuleItem label="Latency > 500ms" active />
                 <RuleItem label="Error Rate > 5%" active />
                 <RuleItem label="Node Down" active />
                 <RuleItem label="Custom: Auth Check" />
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AlertCard({ title, desc, severity, time, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 flex gap-6 group hover:border-emerald-100 transition-all">
      <div className={`w-1.5 rounded-full ${color}`} />
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-black font-sora text-slate-900">{title}</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>
        </div>
        <p className="text-sm text-slate-500 font-medium mb-4">{desc}</p>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white ${color}`}>{severity}</span>
          <button className="text-xs font-bold text-emerald-600 hover:underline">View Trace</button>
        </div>
      </div>
    </div>
  );
}

function ResolvedRow({ title, res, dur }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-8 py-6 font-bold text-sm">{title}</td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
          <CheckCircle2 size={14} /> {res}
        </div>
      </td>
      <td className="px-8 py-6 text-xs text-slate-400 font-bold">{dur}</td>
      <td className="px-8 py-6 text-right">
        <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Analyze</button>
      </td>
    </tr>
  );
}

function RuleItem({ label, active }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} />
    </div>
  );
}
