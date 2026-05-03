export interface IRequestContext {
  traceId: string;
  spanId: string;
}

export enum EventType {
  TRACE = "TRACE",
  LOG = "LOG",
  METRIC = "METRIC",
}

export interface IEvent {
  eventId: string;
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  tenantId?: string; // Links to Organization.id
  type: EventType;
  service: string;
  name: string;
  timestamp: number;
  payload: Record<string, any>;
}
