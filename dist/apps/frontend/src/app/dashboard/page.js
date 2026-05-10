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
exports.default = DashboardPage;
const react_1 = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const DashboardLayout_1 = __importDefault(require("@/components/DashboardLayout"));
const lucide_react_1 = require("lucide-react");
const echarts_for_react_1 = __importDefault(require("echarts-for-react"));
function DashboardPage() {
    const [traces, setTraces] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchData = () => {
        setLoading(true);
        fetch('http://localhost:4002/api/v1/traces')
            .then(res => res.json())
            .then(data => {
            if (data.success)
                setTraces(data.data);
            setLoading(false);
        })
            .catch(err => setLoading(false));
    };
    (0, react_1.useEffect)(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);
    const chartOptions = (0, react_1.useMemo)(() => ({
        backgroundColor: 'transparent',
        grid: { top: 20, right: 20, bottom: 40, left: 40 },
        xAxis: {
            type: 'category',
            data: traces.slice(0, 10).map(t => new Date(t.start_time).toLocaleTimeString()),
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            axisLine: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [{
                data: [12, 45, 23, 78, 56, 34, 90, 45, 34, 67],
                type: 'bar',
                itemStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#34d399' }]
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }]
    }), [traces]);
    return (<DashboardLayout_1.default>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">System Health</h2>
          <p className="text-slate-500 font-medium">Global operational overview across all cluster nodes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Refresh <lucide_react_1.RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Throughput" value="1.2M" trend="+12.4%" color="bg-emerald-500" text="text-white" icon={<lucide_react_1.TrendingUp className="text-white/40"/>}/>
        <StatCard label="Error Rate" value="0.02%" trend="0.0%" color="bg-white" icon={<lucide_react_1.AlertTriangle className="text-orange-400"/>}/>
        <StatCard label="System Integrity" value="99.9%" trend="Secure" color="bg-white" icon={<lucide_react_1.ShieldAlert className="text-emerald-500"/>}/>
        <StatCard label="Active Services" value="12" trend="Operational" color="bg-white" icon={<lucide_react_1.Server className="text-blue-400"/>}/>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold font-sora mb-8">Temporal Event Velocity</h3>
            <echarts_for_react_1.default option={chartOptions} style={{ height: '320px' }}/>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold font-sora">Recent Activity Stream</h3>
              <link_1.default href="/traces" className="text-emerald-500 font-bold text-xs flex items-center gap-1 hover:underline">
                View All Traces <lucide_react_1.ChevronRight className="w-4 h-4"/>
              </link_1.default>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                    <th className="px-8 py-5">Event Reference</th>
                    <th className="px-8 py-5">Integrity</th>
                    <th className="px-8 py-5">Load</th>
                    <th className="px-8 py-5">Node Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {traces.slice(0, 5).map((t) => (<tr key={t.trace_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-sm">{t.trace_id.substring(0, 16)}...</div>
                        <div className="text-[10px] text-slate-400 font-bold">{new Date(t.start_time).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold uppercase">
                          <lucide_react_1.CheckCircle2 size={12}/> SECURE
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-slate-500 text-sm">{t.event_count} events</td>
                      <td className="px-8 py-6">
                        <div className="flex gap-1.5">
                          {t.services.slice(0, 2).map((s) => (<span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md">{s}</span>))}
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/30 rounded-full blur-3xl"/>
            <lucide_react_1.Activity className="w-12 h-12 text-emerald-400 mb-8 opacity-50"/>
            <h3 className="text-2xl font-black font-sora mb-4 leading-tight">Insight Engine Active.</h3>
            <p className="text-emerald-100/60 font-medium text-sm leading-relaxed mb-10">
              Heuristic analysis complete. System is performing 14% above baseline efficiency.
            </p>
            <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</div>
              <div className="text-lg font-bold">Optimal Performance</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold font-sora mb-6">Service Health</h3>
            <div className="space-y-6">
              <HealthItem label="API Gateway" value={98}/>
              <HealthItem label="Auth Service" value={100}/>
              <HealthItem label="Query Engine" value={94}/>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout_1.default>);
}
function StatCard({ label, value, trend, color, text, icon }) {
    return (<div className={`${color || 'bg-white'} p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-6">{icon}</div>
      <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${text || 'text-slate-400'}`}>{label}</div>
      <div className="flex items-end justify-between">
        <div className={`text-4xl font-black font-sora tracking-tighter ${text || 'text-slate-900'}`}>{value}</div>
        <div className={`text-xs font-bold ${trend.startsWith('+') ? (text ? 'text-emerald-200' : 'text-emerald-500') : (text ? 'text-red-200' : 'text-red-500')}`}>
          {trend}
        </div>
      </div>
    </div>);
}
function HealthItem({ label, value }) {
    return (<div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span className={value > 95 ? 'text-emerald-500' : 'text-orange-500'}>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${value > 95 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${value}%` }}/>
      </div>
    </div>);
}
