export interface GalectoConfig {
  apiKey: string;
  service: string;
  baseUrl?: string;
  batchSize?: number;
  flushInterval?: number;
  maxRetries?: number;
  sampleRate?: number;
  timeout?: number;
}

export interface LogPayload {
  level?: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  payload?: Record<string, any>;
  timestamp?: number;
}

export interface TracePayload {
  name: string;
  duration: number;
  status?: 'ok' | 'error';
  attributes?: Record<string, any>;
}

interface QueuedEvent {
  type: string;
  data: any;
  timestamp: number;
}

export class Galecto {
  private apiKey: string;
  private service: string;
  private baseUrl: string;
  private enabled: boolean = true;
  private batchSize: number;
  private flushInterval: number;
  private maxRetries: number;
  private sampleRate: number;
  private timeout: number;
  private queue: QueuedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private destroyed: boolean = false;

  constructor(config: GalectoConfig) {
    this.apiKey = config.apiKey;
    this.service = config.service;
    this.baseUrl = config.baseUrl || "http://localhost:3001";
    this.batchSize = config.batchSize || 100;
    this.flushInterval = config.flushInterval || 5000;
    this.maxRetries = config.maxRetries || 3;
    this.sampleRate = config.sampleRate || 1;
    this.timeout = config.timeout || 10000;

    if (!this.apiKey) {
      console.warn("Galecto: API key is required. Tracking disabled.");
      this.enabled = false;
    }

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
      console.error(`Galecto: Failed to send event after ${this.maxRetries} retries:`, error);
    }
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  private sendToQueue(type: string, data: any): void {
    if (!this.shouldSample() || this.destroyed) return;

    this.queue.push({
      type,
      data,
      timestamp: Date.now()
    });

    if (this.queue.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

  log(payload: LogPayload) {
    this.sendToQueue("LOG", {
      level: payload.level || "info",
      message: payload.message,
      payload: payload.payload,
      timestamp: payload.timestamp || Date.now()
    });
  }

  error(message: string, payload?: Record<string, any>) {
    this.log({ level: "error", message, payload });
  }

  info(message: string, payload?: Record<string, any>) {
    this.log({ level: "info", message, payload });
  }

  warn(message: string, payload?: Record<string, any>) {
    this.log({ level: "warn", message, payload });
  }

  debug(message: string, payload?: Record<string, any>) {
    this.log({ level: "debug", message, payload });
  }

  trace(payload: TracePayload) {
    this.sendToQueue("TRACE", {
      name: payload.name,
      duration: payload.duration,
      status: payload.status || "ok",
      attributes: payload.attributes,
      timestamp: Date.now()
    });
  }

  metric(name: string, value: number, unit?: string) {
    this.sendToQueue("METRIC", {
      name,
      value,
      unit,
      timestamp: Date.now()
    });
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;

        this.trace({
          name: 'http-request',
          duration,
          attributes: {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            route: req.route?.path || req.path
          }
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

export default Galecto;