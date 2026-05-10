"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MonitoringPage;
const react_1 = __importStar(require("react"));
const DashboardLayout_1 = __importDefault(require("@/components/DashboardLayout"));
const lucide_react_1 = require("lucide-react");
const apiClient_1 = require("@/lib/apiClient");
function MonitoringPage() {
    const [metrics, setMetrics] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const data = await (0, apiClient_1.queryFetch)('/api/v1/traces/metrics');
            if (data.success)
                setMetrics(data.data);
        }
        catch (err) {
            console.error('Failed to fetch metrics', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);
    return (<DashboardLayout_1.default>
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
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"/>
            <div className="relative z-10 flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black font-sora text-white">Quantum Stream</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Ingestion Active</span>
                  </div>
               </div>
               <lucide_react_1.Activity className="text-white/20 w-12 h-12"/>
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto pr-4 custom-scrollbar">
              {loading && metrics.length === 0 ? (<div className="h-full flex items-center justify-center">
                   <lucide_react_1.Loader2 className="w-12 h-12 text-emerald-500 animate-spin"/>
                </div>) : metrics.map((m, i) => (<div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md flex items-center gap-8 group hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                     <lucide_react_1.Server size={24}/>
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
                </div>))}
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="col-span-4 space-y-6">
          <StatCard icon={<lucide_react_1.Globe />} title="Global Traffic" value="2.4k" unit="req/s" color="bg-blue-500"/>
          <StatCard icon={<lucide_react_1.Cpu />} title="Total CPU Usage" value="42" unit="%" color="bg-emerald-500"/>
          <StatCard icon={<lucide_react_1.Database />} title="ClickHouse Load" value="12" unit="%" color="bg-orange-500"/>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
             <h4 className="text-sm font-black font-sora uppercase tracking-widest text-slate-400 mb-6">Cluster Health</h4>
             <div className="space-y-4">
                <HealthItem label="API Gateway" status="Healthy"/>
                <HealthItem label="Auth Service" status="Healthy"/>
                <HealthItem label="Log Service" status="Warning"/>
                <HealthItem label="Query Service" status="Healthy"/>
                <HealthItem label="Kafka Cluster" status="Healthy"/>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout_1.default>);
}
function StatCard({ icon, title, value, unit, color }) {
    return (<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl text-white ${color} shadow-lg shadow-current/20`}>
        {react_1.default.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
        <div className="flex items-baseline gap-1">
           <span className="text-2xl font-black font-sora">{value}</span>
           <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>);
}
function HealthItem({ label, status }) {
    return (<div className="flex justify-between items-center">
       <span className="text-sm font-bold text-slate-600">{label}</span>
       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${status === 'Healthy' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
          {status}
       </span>
    </div>);
}
