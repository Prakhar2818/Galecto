export interface GalectoConfig {
  apiKey: string;
  service: string;
  baseUrl?: string;
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

export class Galecto {
  private apiKey: string;
  private service: string;
  private baseUrl: string;
  private enabled: boolean = true;

  constructor(config: GalectoConfig) {
    this.apiKey = config.apiKey;
    this.service = config.service;
    this.baseUrl = config.baseUrl || "http://localhost:3001";
    
    if (!this.apiKey) {
      console.warn("Galecto: API key is required. Tracking disabled.");
      this.enabled = false;
    }
  }

  private async sendToIngest(event: string, data: any) {
    if (!this.enabled) return;
    
    try {
      await fetch(`${this.baseUrl}/api/v1/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "x-service": this.service
        },
        body: JSON.stringify({
          service: this.service,
          event,
          payload: data
        })
      });
    } catch (error) {
      console.error("Galecto: Failed to send telemetry:", error);
    }
  }

  log(payload: LogPayload) {
    this.sendToIngest("LOG", {
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
    this.sendToIngest("TRACE", {
      name: payload.name,
      duration: payload.duration,
      status: payload.status || "ok",
      attributes: payload.attributes,
      timestamp: Date.now()
    });
  }

  metric(name: string, value: number, unit?: string) {
    this.sendToIngest("METRIC", {
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
}

export default Galecto;