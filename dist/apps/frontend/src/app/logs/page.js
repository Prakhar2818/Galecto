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
exports.default = LogsPage;
const react_1 = __importStar(require("react"));
const DashboardLayout_1 = __importDefault(require("@/components/DashboardLayout"));
const lucide_react_1 = require("lucide-react");
const apiClient_1 = require("@/lib/apiClient");
function LogsPage() {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [search, setSearch] = (0, react_1.useState)('');
    const [service, setService] = (0, react_1.useState)('');
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (search)
                query.append('search', search);
            if (service)
                query.append('service', service);
            const data = await (0, apiClient_1.queryFetch)(`/api/v1/logs?${query.toString()}`);
            if (data.success)
                setLogs(data.data);
        }
        catch (err) {
            console.error('Failed to fetch logs', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchLogs();
    }, [service]);
    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs();
    };
    return (<DashboardLayout_1.default>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Logs Explorer</h2>
          <p className="text-slate-500 font-medium">Deep-search across millions of structured events.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2">
            Export JSON <lucide_react_1.Download className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 mb-10 items-center">
        <div className="flex-grow relative">
          <lucide_react_1.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Search by Message or Payload..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm"/>
        </div>
        <select value={service} onChange={(e) => setService(e.target.value)} className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:border-emerald-500">
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
            {loading && logs.length === 0 ? (<tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <lucide_react_1.Loader2 className="w-8 h-8 text-emerald-500 animate-spin"/>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning ClickHouse clusters...</span>
                  </div>
                </td>
              </tr>) : logs.map((log, idx) => (<tr key={idx} className="hover:bg-slate-50 transition-colors group cursor-pointer">
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
              </tr>))}
            {!loading && logs.length === 0 && (<tr>
                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No records matching your filters found.
                </td>
              </tr>)}
          </tbody>
        </table>
        <div className="p-8 bg-slate-50/30 flex justify-center border-t border-slate-50">
           <button onClick={fetchLogs} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Refresh Stream</button>
        </div>
      </div>
    </DashboardLayout_1.default>);
}
