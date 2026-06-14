export interface SessionReplayConfig {
  enabled?: boolean;
  maskAllInputs?: boolean;
  maskInputOptions?: Record<string, boolean>;
  blockClass?: string;
  ignoreClass?: string;
  errorOnly?: boolean;
  maxDuration?: number;
  flushInterval?: number;
}

export class SessionReplayManager {
  private config: Required<SessionReplayConfig>;
  private sessionId: string;
  private traceId: string | null = null;
  private events: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private startTime: number;
  private hasError: boolean = false;
  private destroyed: boolean = false;
  private baseUrl: string;
  private apiKey: string;
  private service: string;
  private recordStop: (() => void) | null = null;

  constructor(
    config: SessionReplayConfig,
    baseUrl: string,
    apiKey: string,
    service: string,
    traceId?: string
  ) {
    this.config = {
      enabled: true,
      maskAllInputs: true,
      maskInputOptions: { password: true, creditCard: true, email: true, tel: true },
      blockClass: "galecto-block",
      ignoreClass: "galecto-ignore",
      errorOnly: true,
      maxDuration: 10 * 60 * 1000,
      flushInterval: 2000,
      ...config,
    };
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.service = service;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    if (traceId) {
      this.traceId = traceId;
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  start(): void {
    if (this.destroyed || typeof window === "undefined") return;

    try {
      // Dynamic import rrweb to avoid SSR issues
      const rrweb = require("rrweb");
      this.recordStop = rrweb.record({
        emit: (event: any) => {
          if (this.destroyed) return;
          this.events.push(event);
        },
        maskAllInputs: this.config.maskAllInputs,
        maskInputOptions: this.config.maskInputOptions,
        blockClass: this.config.blockClass,
        ignoreClass: this.config.ignoreClass,
        inlineStylesheet: true,
        collectFonts: false,
      });
    } catch (e) {
      console.warn("Galecto: rrweb not available, session replay disabled.");
      return;
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Auto-stop after maxDuration
    setTimeout(() => {
      this.stop();
    }, this.config.maxDuration);
  }

  flagError(): void {
    this.hasError = true;
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0 || this.destroyed) return;

    const batch = this.events.splice(0, this.events.length);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/session-replay/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "x-service": this.service,
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          traceId: this.traceId,
          events: batch,
          metadata: {
            url: typeof window !== "undefined" ? window.location.href : undefined,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            startTime: this.startTime,
            hasError: this.hasError,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Galecto: Failed to flush session replay events:", error);
    }
  }

  async stop(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.recordStop) {
      this.recordStop();
      this.recordStop = null;
    }

    // Final flush
    await this.flush();

    // If errorOnly and no error occurred, tell backend to discard
    if (this.config.errorOnly && !this.hasError) {
      try {
        await fetch(`${this.baseUrl}/api/v1/session-replay/record`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "x-service": this.service,
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            traceId: this.traceId,
            events: [],
            metadata: {
              url: typeof window !== "undefined" ? window.location.href : undefined,
              userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
              startTime: this.startTime,
              endTime: Date.now(),
              hasError: false,
            },
          }),
        });
      } catch (error) {
        console.error("Galecto: Failed to discard session replay:", error);
      }
    }
  }
}
