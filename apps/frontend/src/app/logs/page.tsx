"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Filter, Download, FileText, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { queryFetch } from '@/lib/apiClient';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [service, setService] = useState('');

  const handleExport = () => {
    const jsonString = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `galecto-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (service) query.append('service', service);
      
      const data = await queryFetch(`/api/v1/logs?${query.toString()}`);
      if (data.success) setLogs(data.data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [service]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Logs Explorer</h2>
          <p className="text-slate-500 font-medium">Deep-search across millions of structured events.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={logs.length === 0}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export JSON <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 mb-10 items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Message or Payload..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm"
          />
        </div>
        <select 
          value={service} 
          onChange={(e) => setService(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Services</option>
          <option value="api-gateway">api-gateway</option>
          <option value="auth-service">auth-service</option>
          <option value="log-service">log-service</option>
          <option value="query-service">query-service</option>
        </select>
        <button type="submit" className="btn-primary !py-3 !px-8">Search</button>
      </form>

      {/* Logs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
              <th className="px-8 py-5 w-48">Timestamp</th>
              <th className="px-8 py-5 w-48">Service</th>
              <th className="px-8 py-5">Event Signature</th>
              <th className="px-8 py-5">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning ClickHouse clusters...</span>
                  </div>
                </td>
              </tr>
            ) : logs.map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="px-8 py-6 text-xs font-mono text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-8 py-6">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md">
                    {log.service_name}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm font-black font-sora text-slate-900">{log.event_name}</td>
                <td className="px-8 py-6">
                   <div className="text-[11px] font-mono text-emerald-600 bg-emerald-50/50 p-2 rounded-lg line-clamp-1 max-w-md">
                      {log.payload}
                   </div>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No records matching your filters found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="p-8 bg-slate-50/30 flex justify-center border-t border-slate-50">
           <button onClick={fetchLogs} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Refresh Stream</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
