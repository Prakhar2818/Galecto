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
exports.default = LoginPage;
const react_1 = __importStar(require("react"));
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const AuthContext_1 = require("@/context/AuthContext");
const apiClient_1 = require("@/lib/apiClient");
function LoginPage() {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const { login } = (0, AuthContext_1.useAuth)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await (0, apiClient_1.apiFetch)('/api/v1/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data.success) {
                login(data.token, data.user);
            }
            else {
                setError(data.error || 'Login failed. Please check your credentials.');
            }
        }
        catch (err) {
            setError('Connection refused. Is the API Gateway running?');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left side: Testimonial & Branding */}
      <div className="md:w-1/2 bg-emerald-600 p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] -mr-32 -mt-32"/>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400 rounded-full blur-[100px] -ml-32 -mb-32"/>
        
        <link_1.default href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <lucide_react_1.Zap className="w-5 h-5 text-emerald-600 fill-current"/>
          </div>
          <span className="text-xl font-black font-sora tracking-tight text-white">Galecto</span>
        </link_1.default>

        <div className="relative z-10 max-w-md">
          <blockquote className="text-3xl font-bold font-sora text-white leading-tight mb-8 italic">
            "The level of insight we got from Galecto within 15 minutes of integration was better than 2 years of manual logging."
          </blockquote>
          <div className="flex items-center gap-4 text-white/80">
            <img src="https://i.pravatar.cc/100?img=32" alt="CTO" className="w-12 h-12 rounded-full border-2 border-white/20"/>
            <div>
              <div className="font-bold text-white">Totok Michael</div>
              <div className="text-sm font-medium">CTO at Crextio</div>
            </div>
          </div>
        </div>

        <div className="text-white/40 text-sm font-medium relative z-10">
          © 2026 Galecto Inc.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="md:w-1/2 bg-white flex items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md space-y-10">
          <div>
            <h2 className="text-4xl font-black font-sora mb-3">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Log in to manage your tracing infrastructure.</p>
          </div>

          <div className="space-y-4">
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              <lucide_react_1.Github className="w-5 h-5"/>
              Continue with GitHub
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4"/>
              Continue with Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-400 bg-white px-4">
              Or use email
            </div>
          </div>

          {error && (<div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl animate-shake">
              {error}
            </div>)}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Work Email</label>
              <input type="email" placeholder="name@company.com" className="input-soft" value={email} onChange={(e) => setEmail(e.target.value)} required/>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Password</label>
                <link_1.default href="/forgot" className="text-xs font-bold text-emerald-600">Forgot?</link_1.default>
              </div>
              <input type="password" placeholder="••••••••" className="input-soft" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-center block py-4 text-lg flex items-center justify-center gap-3">
              {loading ? <lucide_react_1.Loader2 className="animate-spin"/> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500">
            Don't have an account? <link_1.default href="/signup" className="text-emerald-600 font-bold">Sign up for free</link_1.default>
          </p>
        </div>
      </div>
    </div>);
}
