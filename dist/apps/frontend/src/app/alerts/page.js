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
exports.default = AlertsPage;
const react_1 = __importStar(require("react"));
const DashboardLayout_1 = __importDefault(require("@/components/DashboardLayout"));
const lucide_react_1 = require("lucide-react");
const apiClient_1 = require("@/lib/apiClient");
function AlertsPage() {
    const [alerts, setAlerts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const data = await (0, apiClient_1.alertFetch)('/api/v1/alerts');
            if (data.success)
                setAlerts(data.data);
        }
        catch (err) {
            console.error('Failed to fetch alerts', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000); // Auto refresh
        return () => clearInterval(interval);
    }, []);
    const resolveAlert = async (id) => {
        try {
            await (0, apiClient_1.alertFetch)(`/api/v1/alerts/${id}/resolve`, { method: 'POST' });
            fetchAlerts();
        }
        catch (err) {
            console.error('Failed to resolve alert', err);
        }
    };
    return (<DashboardLayout_1.default>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Active Alerts</h2>
          <p className="text-slate-500 font-medium">Real-time anomaly detection and incident management.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAlerts} className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Refresh <lucide_react_1.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
          <button className="btn-primary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Alert Settings <lucide_react_1.Settings className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Alerts List */}
        <div className="col-span-8 space-y-4">
          {loading && alerts.length === 0 ? (<div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
               <lucide_react_1.Loader2 className="w-10 h-10 text-emerald-500 animate-spin"/>
               <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Watching Kafka Streams...</span>
            </div>) : alerts.length === 0 ? (<div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <lucide_react_1.CheckCircle2 className="w-8 h-8 text-emerald-500"/>
               </div>
               <h3 className="text-xl font-black font-sora">All Systems Clear</h3>
               <p className="text-slate-400 max-w-xs">No anomalies detected in the last 24 hours. Your services are running within normal parameters.</p>
            </div>) : alerts.map((alert) => (<div key={alert.id} className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-8 ${alert.status === 'RESOLVED' ? 'border-slate-50 opacity-60' : 'border-red-100 shadow-lg shadow-red-500/5'}`}>
              <div className={`p-4 rounded-2xl ${alert.status === 'RESOLVED' ? 'bg-slate-100' : 'bg-red-100 animate-pulse'}`}>
                {alert.type === 'ERROR' ? <lucide_react_1.AlertTriangle className="text-red-600"/> : <lucide_react_1.Clock className="text-orange-600"/>}
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
              {alert.status === 'ACTIVE' && (<button onClick={() => resolveAlert(alert.id)} className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors">
                  Resolve
                </button>)}
            </div>))}
        </div>

        {/* Sidebar Rules */}
        <div className="col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <h3 className="text-lg font-black font-sora mb-6 flex items-center gap-3">
              <lucide_react_1.Filter className="text-emerald-500" size={20}/> Active Rules
            </h3>
            <div className="space-y-6">
              <RuleItem title="Critical Error Rate" desc="Triggered if any service returns 4xx/5xx status."/>
              <RuleItem title="P99 Latency Breach" desc="Triggered if request duration exceeds 500ms."/>
              <RuleItem title="OOM Prevention" desc="Triggered if pod memory usage > 85%."/>
            </div>
            <button className="w-full mt-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-colors">
              Create New Rule
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout_1.default>);
}
function RuleItem({ title, desc }) {
    return (<div className="border-l-2 border-emerald-500/30 pl-4 py-1">
      <div className="text-sm font-bold text-slate-100">{title}</div>
      <div className="text-[10px] text-slate-400 font-medium mt-1">{desc}</div>
    </div>);
}
