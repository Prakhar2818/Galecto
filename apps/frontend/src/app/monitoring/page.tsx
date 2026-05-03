"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Activity, Globe, Cpu, Server, Database, Loader2, Zap } from 'lucide-react';
import { queryFetch } from '@/lib/apiClient';

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await queryFetch('/api/v1/traces/metrics');
      if (data.success) setMetrics(data.data);
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">System Monitoring</h2>
          <p className="text-slate-500 font-medium">Real-time health telemetry across your distributed nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Quantum Stream (Live Feed) */}
        <div className="col-span-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl h-[600px] flex flex-col">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="relative z-10 flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black font-sora text-white">Quantum Stream</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Ingestion Active</span>
                  </div>
               </div>
               <Activity className="text-white/20 w-12 h-12" />
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto pr-4 custom-scrollbar">
              {loading && metrics.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                   <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                </div>
              ) : metrics.map((m, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md flex items-center gap-8 group hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                     <Server size={24} />
                  </div>
                  <div className="flex-grow">
                     <div className="text-white font-bold font-sora">{m.service_name}</div>
                     <div className="text-xs text-white/40 font-medium">Instance-ID: {Math.random().toString(36).substr(2, 5).toUpperCase()}</div>
                  </div>
                  <div className="text-right flex gap-12">
                     <div>
                        <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">Requests</div>
                        <div className="text-white font-bold">{m.total_requests}</div>
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">P99 Latency</div>
                        <div className="text-emerald-400 font-bold">{Math.round(m.p99_latency)}ms</div>
                     </div>
                     <div>
                        <div className="text-[10px] font-black uppercase text-white/20 tracking-widest">Errors</div>
                        <div className="text-red-400 font-bold">{m.errors}</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="col-span-4 space-y-6">
          <StatCard icon={<Globe />} title="Global Traffic" value="2.4k" unit="req/s" color="bg-blue-500" />
          <StatCard icon={<Cpu />} title="Total CPU Usage" value="42" unit="%" color="bg-emerald-500" />
          <StatCard icon={<Database />} title="ClickHouse Load" value="12" unit="%" color="bg-orange-500" />
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
             <h4 className="text-sm font-black font-sora uppercase tracking-widest text-slate-400 mb-6">Cluster Health</h4>
             <div className="space-y-4">
                <HealthItem label="API Gateway" status="Healthy" />
                <HealthItem label="Auth Service" status="Healthy" />
                <HealthItem label="Log Service" status="Warning" />
                <HealthItem label="Query Service" status="Healthy" />
                <HealthItem label="Kafka Cluster" status="Healthy" />
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, title, value, unit, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl text-white ${color} shadow-lg shadow-current/20`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
        <div className="flex items-baseline gap-1">
           <span className="text-2xl font-black font-sora">{value}</span>
           <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, status }: any) {
  return (
    <div className="flex justify-between items-center">
       <span className="text-sm font-bold text-slate-600">{label}</span>
       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${status === 'Healthy' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
          {status}
       </span>
    </div>
  );
}
