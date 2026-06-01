# Phase 9: SDK Enhancement (Day 12)

## Objective
Enhance the existing Node.js SDK with batching, retry, and proper documentation.

---

## 9.1 SDK Enhancement

### Files to Modify

#### `packages/sdk/src/client.ts`

```typescript
interface GalectoClientOptions {
  apiKey: string;
  service: string;
  baseUrl?: string;
  batchSize?: number;        // Default: 100
  flushInterval?: number;    // Default: 5000ms
  maxRetries?: number;       // Default: 3
  sampleRate?: number;       // 0-1, default: 1 (100%)
  timeout?: number;          // Default: 10000ms
}

interface QueuedEvent {
  type: string;
  data: any;
  timestamp: number;
}

export class GalectoClient {
  private queue: QueuedEvent[] = [];
  private batchSize: number;
  private flushInterval: number;
  private maxRetries: number;
  private sampleRate: number;
  private timeout: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private baseUrl: string;
  private apiKey: string;
  private service: string;
  private destroyed = false;

  constructor(options: GalectoClientOptions) {
    this.apiKey = options.apiKey;
    this.service = options.service;
    this.baseUrl = options.baseUrl || "http://localhost:3001";
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 5000;
    this.maxRetries = options.maxRetries || 3;
    this.sampleRate = options.sampleRate || 1;
    this.timeout = options.timeout || 10000;

    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (this.destroyed) return;
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || this.destroyed) return;

    const batch = this.queue.splice(0, this.batchSize);
    const promises = batch.map(event => this.sendWithRetry(event, 0));
    await Promise.allSettled(promises);
  }

  private async sendWithRetry(event: QueuedEvent, attempt: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "x-service": this.service
        },
        body: JSON.stringify({
          service: this.service,
          event: event.type,
          payload: event.data
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(event, attempt + 1);
      }
      console.error(`Failed to send event after ${this.maxRetries} retries:`, error);
    }
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  log(level: string, message: string, payload?: Record<string, any>): void {
    if (!this.shouldSample() || this.destroyed) return;
    this.queue.push({
      type: "LOG",
      data: { level, message, payload, timestamp: Date.now() }
    });
    if (this.queue.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

  error(message: string, payload?: Record<string, any>): void {
    this.log("error", message, payload);
  }

  info(message: string, payload?: Record<string, any>): void {
    this.log("info", message, payload);
  }

  warn(message: string, payload?: Record<string, any>): void {
    this.log("warn", message, payload);
  }

  debug(message: string, payload?: Record<string, any>): void {
    this.log("debug", message, payload);
  }

  trace(name: string, duration: number, status?: string, attributes?: Record<string, any>): void {
    if (!this.shouldSample() || this.destroyed) return;
    this.queue.push({
      type: "TRACE",
      data: { name, duration, status: status || "ok", attributes, timestamp: Date.now() }
    });
    if (this.queue.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

  metric(name: string, value: number, unit?: string): void {
    if (!this.shouldSample() || this.destroyed) return;
    this.queue.push({
      type: "METRIC",
      data: { name, value, unit, timestamp: Date.now() }
    });
    if (this.queue.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        this.trace("http-request", duration, res.statusCode >= 400 ? "error" : "ok", {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          route: req.route?.path || req.path
        });

        if (res.statusCode >= 400) {
          this.error(`HTTP ${res.statusCode}: ${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            method: req.method,
            path: req.path
          });
        }
      });
      next();
    };
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Named exports for ESM
export { GalectoClient as default, GalectoClient };
```

#### `packages/sdk/src/index.ts`

```typescript
export { GalectoClient } from "./client";
export { default } from "./client";

export interface GalectoConfig {
  apiKey: string;
  service: string;
  baseUrl?: string;
}

export interface LogPayload {
  level?: "debug" | "info" | "warn" | "error";
  message: string;
  payload?: Record<string, any>;
  timestamp?: number;
}

export interface TracePayload {
  name: string;
  duration: number;
  status?: "ok" | "error";
  attributes?: Record<string, any>;
}
```

### Re-publish SDK

```bash
cd packages/sdk
npm version patch  # 1.0.2 -> 1.0.3
npm run build
npm publish --access public
```

---

## 9.2 Developer Documentation

### `apps/frontend/src/app/developer/page.tsx`

```typescript
export default function DeveloperPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Developer Documentation</h1>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Install SDK</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono">
          npm install @prakhar2818/galecto-sdk
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Start</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`import Galecto from '@prakhar2818/galecto-sdk';

const galecto = new Galecto({
  apiKey: 'gl_your_api_key',
  service: 'my-app',
  batchSize: 100,
  flushInterval: 5000,
  maxRetries: 3
});

galecto.info('Application started');
galecto.trace('api-request', 150, 'ok', { method: 'GET' });`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Configuration Options</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Option</th>
              <th className="text-left p-2">Default</th>
              <th className="text-left p-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">batchSize</td>
              <td className="p-2">100</td>
              <td className="p-2">Number of events to batch before sending</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">flushInterval</td>
              <td className="p-2">5000</td>
              <td className="p-2">Milliseconds between flushes</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">maxRetries</td>
              <td className="p-2">3</td>
              <td className="p-2">Maximum retry attempts on failure</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">sampleRate</td>
              <td className="p-2">1</td>
              <td className="p-2">Sampling rate (0-1)</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">timeout</td>
              <td className="p-2">10000</td>
              <td className="p-2">Request timeout in milliseconds</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Express Integration</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
{`const express = require('express');
const Galecto = require('@prakhar2818/galecto-sdk');

const galecto = new Galecto({
  apiKey: process.env.GALECTO_API_KEY,
  service: 'express-app'
});

const app = express();
app.use(galecto.middleware());`}
        </pre>
      </section>
    </div>
  );
}
```

---

## Verification Checklist

- [ ] SDK batches events
- [ ] SDK retries on failure
- [ ] SDK flushes on destroy
- [ ] SDK sampling works
- [ ] Developer docs complete
- [ ] SDK published to npm

## Next Steps
Proceed to [10-launch-checklist.md](./10-launch-checklist.md)
