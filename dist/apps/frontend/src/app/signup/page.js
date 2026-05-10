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
exports.default = SignupPage;
const react_1 = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const AuthContext_1 = require("@/context/AuthContext");
const apiClient_1 = require("@/lib/apiClient");
function SignupPage() {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [orgName, setOrgName] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const { login } = (0, AuthContext_1.useAuth)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await (0, apiClient_1.apiFetch)('/api/v1/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ email, password, organizationName: orgName }),
            });
            if (data.success) {
                login(data.token, data.user);
            }
            else {
                setError(data.error || 'Signup failed. Please try again.');
            }
        }
        catch (err) {
            setError('Connection refused. Is the API Gateway running?');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse">
      {/* Left side: Why Antigravity */}
      <div className="md:w-1/2 bg-slate-900 p-12 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] -ml-32 -mt-32"/>
        
        <link_1.default href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <lucide_react_1.Zap className="w-5 h-5 text-white fill-current"/>
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
        </link_1.default>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black font-sora mb-12">Start your 14-day free trial.</h2>
          <div className="space-y-8">
            <FeaturePoint title="Unlimited Trace Storage" desc="Retain spans for up to 30 days with ClickHouse power."/>
            <FeaturePoint title="Advanced Causality Diff" desc="Compare request trees across deployments."/>
            <FeaturePoint title="Smart Anomaly Detection" desc="Get notified when P99 spikes in real-time."/>
          </div>
        </div>

        <div className="text-slate-500 text-sm font-medium relative z-10">
          Trusted by over 500+ engineering teams worldwide.
        </div>
      </div>

      {/* Right side: Signup Form */}
      <div className="md:w-1/2 bg-white flex items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md space-y-10">
          <div>
            <h2 className="text-4xl font-black font-sora mb-3">Create Account</h2>
            <p className="text-slate-500 font-medium">Join the next generation of observability.</p>
          </div>

          {error && (<div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl">
              {error}
            </div>)}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Organization Name</label>
              <input type="text" placeholder="Acme Corp" className="input-soft" value={orgName} onChange={(e) => setOrgName(e.target.value)} required/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Work Email</label>
              <input type="email" placeholder="name@company.com" className="input-soft" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
              <input type="password" placeholder="••••••••" className="input-soft" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-center block py-4 text-lg flex items-center justify-center gap-3">
              {loading ? <lucide_react_1.Loader2 className="animate-spin"/> : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500">
            Already have an account? <link_1.default href="/login" className="text-emerald-600 font-bold">Sign in</link_1.default>
          </p>
        </div>
      </div>
    </div>);
}
function FeaturePoint({ title, desc }) {
    return (<div className="flex gap-4">
      <lucide_react_1.CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0"/>
      <div>
        <div className="font-bold text-slate-100">{title}</div>
        <div className="text-sm text-slate-400">{desc}</div>
      </div>
    </div>);
}
