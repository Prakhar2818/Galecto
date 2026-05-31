"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Terminal, Code2, Book, Copy, Check, Zap, Server, ShieldCheck, Box } from 'lucide-react';

export default function DeveloperDocsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSdkClick = (sdkName: string, disabled: boolean) => {
    if (disabled) {
      setToastMessage(`${sdkName} SDK is coming soon!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setToastMessage(`${sdkName} SDK - Installation guide below`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleRotateKeys = () => {
    router.push('/settings?tab=api-keys');
  };

  const nodeCode = `// Install: npm install @galecto/sdk
const Galecto = require('@galecto/sdk');

const galecto = new Galecto({
  apiKey: 'YOUR_PROJECT_API_KEY',
  service: 'billing-service'
});

// Auto-track traces and logs
galecto.log({
  level: 'info',
  message: 'Payment processed successfully',
  payload: { amount: 29.99, currency: 'USD' }
});`;

  const curlCode = `curl -X POST http://localhost:3001/api/v1/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service": "order-service",
    "event": "ORDER_CREATED",
    "payload": { "orderId": "ORD-123" }
  }'`;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Developer Hub</h2>
          <p className="text-slate-500 font-medium">Integrate your distributed architecture with our causality engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="col-span-8 space-y-12">
          {/* Section: Getting Started */}
          <section>
            <h3 className="text-xl font-black font-sora mb-6 flex items-center gap-3">
              <Zap className="text-emerald-500" /> Quick Start
            </h3>
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px]" />
               <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                     </div>
                     <button 
                       onClick={() => copyCode('node', nodeCode)}
                       className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                     >
                        {copied === 'node' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copied === 'node' ? 'Copied!' : 'Copy Snippet'}
                     </button>
                  </div>
                  <pre className="font-mono text-sm leading-relaxed text-emerald-100/80 overflow-x-auto">
                    <code>{nodeCode}</code>
                  </pre>
               </div>
            </div>
          </section>

          {/* Section: API Reference */}
          <section>
            <h3 className="text-xl font-black font-sora mb-6 flex items-center gap-3">
              <Terminal className="text-blue-500" /> HTTP API Reference
            </h3>
            <div className="space-y-6">
               <ApiEndpoint 
                  method="POST" 
                  path="/api/v1/ingest" 
                  desc="Ingest raw telemetry data (logs, traces, errors)."
                  code={curlCode}
                  copied={copied === 'curl'}
                  onCopy={() => copyCode('curl', curlCode)}
               />
               <ApiEndpoint 
                  method="GET" 
                  path="/api/v1/traces/:id" 
                  desc="Retrieve the full causality tree for a specific trace."
               />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-sm font-black font-sora uppercase tracking-widest text-slate-400 mb-6">Integration SDKs</h4>
<div className="space-y-4">
                  <SdkItem icon={<Code2 className="text-blue-500" />} name="Node.js SDK" version="v1.2.0" onClick={() => handleSdkClick('Node.js', false)} />
                  <SdkItem icon={<Server className="text-orange-500" />} name="Go Package" version="Coming Soon" disabled onClick={() => handleSdkClick('Go', true)} />
                  <SdkItem icon={<Box className="text-blue-400" />} name="Python Wrapper" version="Coming Soon" disabled onClick={() => handleSdkClick('Python', true)} />
               </div>
           </div>

           <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white">
              <ShieldCheck size={32} className="mb-4 opacity-50" />
              <h4 className="text-lg font-black font-sora mb-2">Auth Guidance</h4>
              <p className="text-sm text-emerald-50/80 leading-relaxed font-medium">
                Always use Bearer token authentication in your headers. Keep your API keys secret and never expose them in client-side code.
              </p>
<button 
               onClick={handleRotateKeys}
               className="mt-6 text-sm font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 py-3 w-full rounded-xl transition-all"
            >
                 Rotate Keys
               </button>
           </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">{toastMessage}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SdkItem({ icon, name, version, disabled, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-2xl border border-slate-50 ${disabled ? 'opacity-40 grayscale' : 'hover:bg-slate-50 transition-colors cursor-pointer'}`}
    >
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
             {icon}
          </div>
          <div>
             <div className="text-sm font-bold text-slate-900">{name}</div>
             <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{version}</div>
          </div>
       </div>
       {!disabled && <Book size={16} className="text-slate-300" />}
    </div>
  );
}

function ApiEndpoint({ method, path, desc, code, copied, onCopy }: any) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
       <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${method === 'POST' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
             {method}
          </span>
          <span className="font-mono text-sm font-bold text-slate-700">{path}</span>
       </div>
       <div className="p-6">
          <p className="text-sm text-slate-500 font-medium mb-4">{desc}</p>
          {code && (
            <div className="bg-slate-50 p-4 rounded-xl relative group">
               <button 
                 onClick={onCopy}
                 className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
               </button>
               <pre className="text-[11px] font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">
                  {code}
               </pre>
            </div>
          )}
       </div>
    </div>
  );
}
