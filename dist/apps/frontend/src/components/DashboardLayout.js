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
exports.default = DashboardLayout;
const react_1 = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const AuthContext_1 = require("@/context/AuthContext");
function DashboardLayout({ children }) {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const { user, loading, logout } = (0, AuthContext_1.useAuth)();
    (0, react_1.useEffect)(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    if (loading || !user) {
        return (<div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <lucide_react_1.Loader2 className="w-10 h-10 text-emerald-500 animate-spin"/>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Validating Session...</span>
        </div>
      </div>);
    }
    const navItems = [
        { icon: <lucide_react_1.LayoutDashboard size={20}/>, label: "Dashboard", href: "/dashboard" },
        { icon: <lucide_react_1.Activity size={20}/>, label: "Request Tracing", href: "/traces" },
        { icon: <lucide_react_1.FileText size={20}/>, label: "Logs Explorer", href: "/logs" },
        { icon: <lucide_react_1.RotateCcw size={20}/>, label: "Replay System", href: "/replay" },
        { icon: <lucide_react_1.Bell size={20}/>, label: "Alerts", href: "/alerts" },
        { icon: <lucide_react_1.Zap size={20}/>, label: "Live Monitoring", href: "/monitoring" },
        { icon: <lucide_react_1.Code2 size={20}/>, label: "Developer Hub", href: "/developer" },
    ];
    return (<div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <lucide_react_1.Zap className="w-6 h-6 text-white fill-current"/>
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (<link_1.default key={item.href} href={item.href} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${pathname === item.href
                ? 'bg-emerald-50 text-emerald-600 font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
              <div className={`${pathname === item.href ? 'text-emerald-600' : 'group-hover:text-slate-900'}`}>
                {item.icon}
              </div>
              <span className="text-sm tracking-tight">{item.label}</span>
              {pathname === item.href && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"/>}
            </link_1.default>))}
        </nav>

        <div className="space-y-4 pt-8 border-t border-slate-50">
          <link_1.default href="/settings" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all ${pathname === '/settings' ? 'text-emerald-600 font-bold bg-emerald-50' : ''}`}>
            <lucide_react_1.Settings size={20}/>
            <span className="text-sm tracking-tight">Settings</span>
          </link_1.default>
          <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <lucide_react_1.LogOut size={20}/>
            <span className="text-sm tracking-tight font-medium">Logout</span>
          </button>
          
          <div className="bg-slate-900 p-6 rounded-3xl mt-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"/>
            <h4 className="text-white font-bold text-sm mb-1 relative z-10">{user.organizationName || 'Pro Plan'}</h4>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest relative z-10 mb-3 italic">Production Tier</p>
            <button className="w-full py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl relative z-10 hover:bg-emerald-600 transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-72">
        {/* Global Header */}
        <header className="flex justify-between items-center p-10 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/50">
          <div className="relative w-96">
            <lucide_react_1.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input type="text" placeholder="Search traces, services or logs..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium transition-all"/>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <button className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm relative">
                <lucide_react_1.Mail className="w-4 h-4 text-slate-600"/>
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"/>
              </button>
              <button className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <lucide_react_1.Bell className="w-4 h-4 text-slate-600"/>
              </button>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <div className="text-sm font-black font-sora tracking-tight">{user.email.split('@')[0]}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Admin</div>
              </div>
              <img src={`https://i.pravatar.cc/100?u=${user.email}`} alt="Profile" className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm"/>
            </div>
          </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>
    </div>);
}
