"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bell, AlertTriangle, CheckCircle2, Clock, 
  ChevronRight, Filter, Settings, RefreshCw, Loader2 
} from 'lucide-react';
import { alertFetch } from '@/lib/apiClient';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertFetch('/api/v1/alerts');
      if (data.success) setAlerts(data.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Auto refresh
    return () => clearInterval(interval);
  }, []);

  const resolveAlert = async (id: string) => {
    try {
      await alertFetch(`/api/v1/alerts/${id}/resolve`, { method: 'POST' });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Active Alerts</h2>
          <p className="text-slate-500 font-medium">Real-time anomaly detection and incident management.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAlerts} className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Refresh <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn-primary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Alert Settings <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Alerts List */}
        <div className="col-span-8 space-y-4">
          {loading && alerts.length === 0 ? (
            <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
               <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
               <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Watching Kafka Streams...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
               </div>
               <h3 className="text-xl font-black font-sora">All Systems Clear</h3>
               <p className="text-slate-400 max-w-xs">No anomalies detected in the last 24 hours. Your services are running within normal parameters.</p>
            </div>
          ) : alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-8 ${alert.status === 'RESOLVED' ? 'border-slate-50 opacity-60' : 'border-red-100 shadow-lg shadow-red-500/5'}`}
            >
              <div className={`p-4 rounded-2xl ${alert.status === 'RESOLVED' ? 'bg-slate-100' : 'bg-red-100 animate-pulse'}`}>
                {alert.type === 'ERROR' ? <AlertTriangle className="text-red-600" /> : <Clock className="text-orange-600" />}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.service}</span>
                  <span className="text-[10px] font-bold text-slate-300">•</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <h4 className="text-lg font-black font-sora tracking-tight text-slate-900">{alert.message}</h4>
                <div className="text-xs font-mono text-slate-400 mt-2">Trace ID: {alert.traceId}</div>
              </div>
              {alert.status === 'ACTIVE' && (
                <button 
                  onClick={() => resolveAlert(alert.id)}
                  className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Rules */}
        <div className="col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <h3 className="text-lg font-black font-sora mb-6 flex items-center gap-3">
              <Filter className="text-emerald-500" size={20} /> Active Rules
            </h3>
            <div className="space-y-6">
              <RuleItem title="Critical Error Rate" desc="Triggered if any service returns 4xx/5xx status." />
              <RuleItem title="P99 Latency Breach" desc="Triggered if request duration exceeds 500ms." />
              <RuleItem title="OOM Prevention" desc="Triggered if pod memory usage > 85%." />
            </div>
            <button className="w-full mt-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-colors">
              Create New Rule
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function RuleItem({ title, desc }: any) {
  return (
    <div className="border-l-2 border-emerald-500/30 pl-4 py-1">
      <div className="text-sm font-bold text-slate-100">{title}</div>
      <div className="text-[10px] text-slate-400 font-medium mt-1">{desc}</div>
    </div>
  );
}
