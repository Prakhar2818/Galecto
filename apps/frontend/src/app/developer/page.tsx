"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Terminal, Code2, Book, Copy, Check, Zap, Server, ShieldCheck, Box } from 'lucide-react';

export default function DeveloperDocsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'node' | 'go' | 'python'>('node');

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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

  const goCode = `// Install: go get github.com/galecto/galecto-go
package main

import (
    "github.com/galecto/galecto-go"
)

func main() {
    client := galecto.New(galecto.Config{
        APIKey:   "YOUR_PROJECT_API_KEY",
        Service:  "order-service",
    })

    client.Log(galecto.LogEntry{
        Level:    "info",
        Message:  "Order placed successfully",
        Payload:  map[string]interface{}{"orderId": "ORD-123"},
    })
}`;

  const pythonCode = `# Install: pip install galecto
import galecto

client = galecto.Client(
    api_key='YOUR_PROJECT_API_KEY',
    service='user-service'
)

client.log(
    level='info',
    message='User logged in',
    payload={'userId': 'usr_456', 'method': 'oauth'}
)`;

  const curlCode = `curl -X POST http://localhost:3001/api/v1/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service": "order-service",
    "event": "ORDER_CREATED",
    "payload": { "orderId": "ORD-123" }
  }'`;

  const getTraceCode = `curl -X GET http://localhost:3001/api/v1/traces/TRACE_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const getMetricsCode = `curl -X GET http://localhost:3001/api/v1/traces/metrics \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'go': return goCode;
      case 'python': return pythonCode;
      default: return nodeCode;
    }
  };

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
          {/* Section: SDKs */}
          <section>
            <h3 className="text-xl font-black font-sora mb-6 flex items-center gap-3">
              <Code2 className="text-emerald-500" /> SDK Installation
            </h3>
            
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('node')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'node' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveTab('go')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'go' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Go
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'python' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Python
              </button>
            </div>

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
                       onClick={() => copyCode('sdk', getCurrentCode())}
                       className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                     >
                        {copied === 'sdk' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copied === 'sdk' ? 'Copied!' : 'Copy Snippet'}
                     </button>
                  </div>
                  <pre className="font-mono text-sm leading-relaxed text-emerald-100/80 overflow-x-auto">
                    <code>{getCurrentCode()}</code>
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
                  code={getTraceCode}
                  copied={copied === 'trace'}
                  onCopy={() => copyCode('trace', getTraceCode)}
               />
               <ApiEndpoint 
                  method="GET" 
                  path="/api/v1/traces/metrics" 
                  desc="Retrieve aggregated metrics for all services."
                  code={getMetricsCode}
                  copied={copied === 'metrics'}
                  onCopy={() => copyCode('metrics', getMetricsCode)}
               />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-8">
<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h4 className="text-sm font-black font-sora uppercase tracking-widest text-slate-400 mb-6">Integration SDKs</h4>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <Code2 className="text-blue-500" />
                     </div>
                     <div>
                       <div className="text-sm font-bold text-slate-900">Node.js SDK</div>
                       <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">v1.2.0 • Available</div>
                     </div>
                   </div>
                   <Check size={16} className="text-emerald-500" />
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 opacity-75">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <Server className="text-orange-500" />
                     </div>
                     <div>
                       <div className="text-sm font-bold text-slate-700">Go Package</div>
                       <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Under Development</div>
                     </div>
                   </div>
                   <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-50 rounded-lg">Soon</span>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 opacity-75">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <Box className="text-blue-400" />
                     </div>
                     <div>
                       <div className="text-sm font-bold text-slate-700">Python Wrapper</div>
                       <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Under Development</div>
                     </div>
                   </div>
                   <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-50 rounded-lg">Soon</span>
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 opacity-75">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <Box className="text-purple-500" />
                     </div>
                     <div>
                       <div className="text-sm font-bold text-slate-700">Java SDK</div>
                       <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Under Development</div>
                     </div>
                   </div>
                   <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-50 rounded-lg">Soon</span>
                 </div>
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
    </DashboardLayout>
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
