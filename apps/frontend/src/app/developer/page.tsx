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

  const nodeCode = `// Node.js Integration Guide
// No SDK required — use the REST API directly

const GALECTO_API_KEY = process.env.GALECTO_API_KEY;
const GALECTO_URL = process.env.GALECTO_URL || 'http://localhost:3001';

// 1. Initialize a trace context
function generateTraceId() {
  return crypto.randomUUID();
}

// 2. Send a trace/log event
async function sendGalectoEvent({
  service,
  event,
  payload,
  traceId = generateTraceId()
}) {
  const response = await fetch(\`\${GALECTO_URL}/api/v1/ingest\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GALECTO_API_KEY}\`,
      'x-trace-id': traceId
    },
    body: JSON.stringify({
      service,
      event,
      payload,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(\`Galecto ingest failed: \${response.status}\`);
  }

  return { traceId };
}

// 3. Send an HTTP request trace
async function traceHttpRequest({
  method,
  url,
  headers,
  body,
  service,
  statusCode,
  durationMs
}) {
  return sendGalectoEvent({
    service,
    event: \`\${method.toUpperCase()} \${url}\`,
    payload: {
      method,
      url,
      headers: Object.fromEntries(
        Object.entries(headers).filter(([k]) =>
          ['content-type', 'accept', 'user-agent'].includes(k.toLowerCase())
        )
      ),
      body,
      statusCode,
      durationMs
    }
  });
}

// 4. Express.js middleware example
function galectoMiddleware(serviceName) {
  return async (req, res, next) => {
    const start = Date.now();
    const traceId = req.headers['x-trace-id'] || generateTraceId();
    res.setHeader('x-trace-id', traceId);

    res.on('finish', async () => {
      try {
        await traceHttpRequest({
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
          service: serviceName,
          statusCode: res.statusCode,
          durationMs: Date.now() - start
        });
      } catch (err) {
        console.error('Galecto trace failed:', err);
      }
    });

    next();
  };
}

// Usage
// app.use(galectoMiddleware('api-gateway'));`;

  const goCode = `// Go Integration Guide
// No SDK required — use the REST API directly

package main

import (
    "bytes"
    "crypto/rand"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"
)

const galectoURL = "http://localhost:3001"

// GenerateTraceId creates a unique trace ID
func GenerateTraceId() string {
    b := make([]byte, 16)
    rand.Read(b)
    return hex.EncodeToString(b)
}

// GalectoClient holds the configuration
type GalectoClient struct {
    APIKey string
    URL    string
    Service string
}

// NewGalectoClient creates a client
func NewGalectoClient(apiKey string) *GalectoClient {
    url := os.Getenv("GALECTO_URL")
    if url == "" {
        url = galectoURL
    }
    return &GalectoClient{
        APIKey: apiKey,
        URL:    url,
    }
}

// SendEvent sends a trace/log event
func (c *GalectoClient) SendEvent(service, event string, payload map[string]interface{}) (string, error) {
    traceId := GenerateTraceId()
    
    body := map[string]interface{}{
        "service":   service,
        "event":     event,
        "payload":   payload,
        "timestamp": time.Now().UTC().Format(time.RFC3339),
    }
    
    jsonBody, _ := json.Marshal(body)
    req, _ := http.NewRequest("POST", c.URL+"/api/v1/ingest", bytes.NewBuffer(jsonBody))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+c.APIKey)
    req.Header.Set("x-trace-id", traceId)
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return "", fmt.Errorf("galecto ingest failed: %d", resp.StatusCode)
    }
    
    return traceId, nil
}

// TraceHTTPRequest sends an HTTP request trace
func (c *GalectoClient) TraceHTTPRequest(method, url string, statusCode int, durationMs int64) (string, error) {
    return c.SendEvent(c.Service, method+" "+url, map[string]interface{}{
        "method":     method,
        "url":        url,
        "statusCode": statusCode,
        "durationMs": durationMs,
    })
}`;

  const pythonCode = `# Python Integration Guide
# No SDK required — use the REST API directly

import os
import uuid
import requests
from datetime import datetime, timezone

GALECTO_URL = os.getenv('GALECTO_URL', 'http://localhost:3001')
GALECTO_API_KEY = os.getenv('GALECTO_API_KEY')


class GalectoClient:
    """Galecto REST API client for tracing and logging"""
    
    def __init__(self, api_key: str, service: str = None):
        self.api_key = api_key
        self.service = service
        self.url = GALECTO_URL
    
    def generate_trace_id(self) -> str:
        return str(uuid.uuid4())
    
    def send_event(self, service: str, event: str, payload: dict) -> str:
        trace_id = self.generate_trace_id()
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
            'x-trace-id': trace_id
        }
        
        body = {
            'service': service,
            'event': event,
            'payload': payload,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        resp = requests.post(
            f'{self.url}/api/v1/ingest',
            headers=headers,
            json=body
        )
        
        resp.raise_for_status()
        return trace_id
    
    def trace_http_request(self, method: str, url: str, status_code: int, duration_ms: int):
        return self.send_event(
            self.service,
            f'{method} {url}',
            {
                'method': method,
                'url': url,
                'statusCode': status_code,
                'durationMs': duration_ms
            }
        )


# FastAPI middleware example
import time

class GalectoMiddleware:
    def __init__(self, app, client: GalectoClient):
        self.app = app
        self.client = client
    
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        
        start = time.time()
        trace_id = str(uuid.uuid4())
        
        # Add trace ID to request headers
        headers = dict(scope.get('headers', []))
        headers[b'x-trace-id'] = trace_id.encode()
        
        # Capture response
        async def wrapped_send(message):
            if message['type'] == 'http.response.start':
                duration_ms = int((time.time() - start) * 1000)
                status = message['status']
                path = scope['path']
                method = scope['method']
                
                try:
                    self.client.trace_http_request(method, path, status, duration_ms)
                except Exception as e:
                    print(f'Galecto trace failed: {e}')
            
            await send(message)
        
        await self.app(scope, receive, wrapped_send)`;

  const curlCode = `# Ingest telemetry data
curl -X POST http://localhost:3001/api/v1/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "x-trace-id: $(uuidgen)" \\
  -d '{
    "service": "order-service",
    "event": "ORDER_CREATED",
    "payload": {
      "orderId": "ORD-123",
      "amount": 99.99,
      "currency": "USD"
    }
  }'`;

  const getTraceCode = `# Get a trace by ID
curl -X GET http://localhost:3001/api/v1/traces/TRACE_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const getMetricsCode = `# Get service metrics
curl -X GET "http://localhost:3001/api/v1/traces/metrics" \\
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
                  path="/api/v1/traces" 
                  desc="List all traces with pagination support."
                  code={`curl -X GET "http://localhost:3001/api/v1/traces?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  copied={copied === 'traces'}
                  onCopy={() => copyCode('traces', `curl -X GET "http://localhost:3001/api/v1/traces?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
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
               <ApiEndpoint 
                  method="GET" 
                  path="/api/v1/traces/anomalies" 
                  desc="List recent anomalies detected in traces."
                  code={`curl -X GET "http://localhost:3001/api/v1/traces/anomalies" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  copied={copied === 'anomalies'}
                  onCopy={() => copyCode('anomalies', `curl -X GET "http://localhost:3001/api/v1/traces/anomalies" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
               />
               <ApiEndpoint 
                  method="GET" 
                  path="/api/v1/traces/anomalies-summary" 
                  desc="Get a summary of anomalies in the last 24h."
                  code={`curl -X GET "http://localhost:3001/api/v1/traces/anomalies-summary" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  copied={copied === 'anomaly-summary'}
                  onCopy={() => copyCode('anomaly-summary', `curl -X GET "http://localhost:3001/api/v1/traces/anomalies-summary" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
               />
               <ApiEndpoint 
                  method="POST" 
                  path="/api/v1/replay/:traceId" 
                  desc="Execute a replay of a trace in a shadow environment."
                  code={`curl -X POST "http://localhost:3001/api/v1/replay/TRACE_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  copied={copied === 'replay'}
                  onCopy={() => copyCode('replay', `curl -X POST "http://localhost:3001/api/v1/replay/TRACE_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
               />
            </div>
          </section>

          <section>
            <h3 className="text-xl font-black font-sora mb-6 flex items-center gap-3">
              <Book className="text-orange-500" /> Setup Instructions
            </h3>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3">1. Get Your API Key</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Navigate to Settings → API Integration and create a new API key. Copy the key and store it securely in your environment variables.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <code className="text-xs font-mono text-slate-600">
                    GALECTO_API_KEY=galecto_xxxxxxxxxxxxxxxxxxxx
                  </code>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3">2. Configure Your Service Name</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Use a consistent, descriptive service name for each application or microservice. This makes filtering and tracing much easier.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <code className="text-xs font-mono text-slate-600">
                    service: "api-gateway", "auth-service", "billing-service"
                  </code>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-3">3. Docker Compose Setup</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Run the entire Galecto platform locally with Docker Compose:
                </p>
                <div className="bg-slate-900 p-4 rounded-xl">
                  <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
{`# Clone the repository
git clone https://github.com/galecto/galecto.git
cd galecto

# Start all services
npm run dev:all

# Or start specific services
npm run dev:gateway
npm run dev:query
npm run dev:frontend`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black font-sora uppercase tracking-widest text-slate-400 mb-6">Integration Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                         <Code2 className="text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Node.js / REST</div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available Now</div>
                      </div>
                    </div>
                    <Check size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                         <Server className="text-orange-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Go / REST</div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available Now</div>
                      </div>
                    </div>
                    <Check size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                         <Box className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Python / REST</div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available Now</div>
                      </div>
                    </div>
                    <Check size={16} className="text-emerald-500" />
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
