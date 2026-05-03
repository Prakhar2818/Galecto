"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Filter, Download, FileText, ChevronRight, Calendar } from 'lucide-react';

export default function LogsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Logs Explorer</h2>
          <p className="text-slate-500 font-medium">Deep-search across millions of structured events.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Export JSON <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 mb-10 items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Request ID, Service, or Message..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm"
          />
        </div>
        <FilterSelect icon={<FileText size={16} />} label="Service" />
        <FilterSelect icon={<Calendar size={16} />} label="Last 24h" />
        <button className="btn-primary !py-3 !px-8">Search</button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
              <th className="px-8 py-5 w-48">Timestamp</th>
              <th className="px-8 py-5 w-48">Service</th>
              <th className="px-8 py-5">Message</th>
              <th className="px-8 py-5 text-right">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             <LogLine time="12:45:01" service="api-gateway" message="GET /api/v1/orders - Success" severity="INFO" />
             <LogLine time="12:44:58" service="auth-service" message="Token validated for user_9921" severity="INFO" />
             <LogLine time="12:44:12" service="billing-service" message="Transaction Timeout: Reconnecting to DB" severity="WARN" color="text-orange-500" />
             <LogLine time="12:43:55" service="log-service" message="Batch flush complete (4200 rows)" severity="INFO" />
             <LogLine time="12:42:10" service="api-gateway" message="500 Internal Server Error at /v1/status" severity="ERROR" color="text-red-500" />
          </tbody>
        </table>
        <div className="p-8 bg-slate-50/30 flex justify-center border-t border-slate-50">
           <button className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Load older events...</button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FilterSelect({ icon, label }: any) {
  return (
    <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
      <div className="text-slate-400">{icon}</div>
      <span className="text-sm font-bold text-slate-600">{label}</span>
    </div>
  );
}

function LogLine({ time, service, message, severity, color }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
      <td className="px-8 py-6 text-xs font-mono text-slate-400">{time}</td>
      <td className="px-8 py-6">
        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md">{service}</span>
      </td>
      <td className="px-8 py-6 text-sm font-medium text-slate-700">{message}</td>
      <td className={`px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest ${color || 'text-emerald-500'}`}>
        {severity}
      </td>
    </tr>
  );
}
