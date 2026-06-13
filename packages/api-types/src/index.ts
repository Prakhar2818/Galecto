// ============================================
// SHARED API CONTRACT TYPES
// Used by both frontend and backend services
// ============================================

// ============================================
// Base Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  limit?: number;
}

// ============================================
// Auth Types
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  organizationName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  DEVELOPER = "DEVELOPER",
  OBSERVER = "OBSERVER"
}

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string;
  name: string;
  environment: ProjectEnvironment;
  region?: string;
  organizationId: string;
  apiKeys: ApiKey[];
  createdAt: string;
  updatedAt: string;
}

export enum ProjectEnvironment {
  DEVELOPMENT = "DEVELOPMENT",
  STAGING = "STAGING",
  PRODUCTION = "PRODUCTION"
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  projectId: string;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  scope: ApiKeyScope;
}

export interface ApiKeyScope {
  ingest: boolean;
  read: boolean;
  write: boolean;
}

export interface CreateProjectRequest {
  name: string;
  environment?: ProjectEnvironment;
  region?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresInDays?: number;
  scope?: ApiKeyScope;
}

// ============================================
// Organization Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  retentionDays: number;
}

export interface UpdateSettingsRequest {
  retentionDays?: number;
}

// ============================================
// Alert / Incident Types
// ============================================

export interface Alert {
  id: string;
  traceId: string;
  service: string;
  type: string;
  message: string;
  status: AlertStatus;
  severity: AlertSeverity;
  organizationId: string;
  assignedTo?: string;
  slaDueAt?: string;
  createdAt: string;
  resolvedAt?: string;
  notes?: IncidentNote[];
}

export enum AlertStatus {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  RESOLVED = "RESOLVED"
}

export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO"
}

export interface IncidentNote {
  id: string;
  alertId: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export interface AcknowledgeIncidentRequest {
  assignedTo?: string;
  slaDueInHours?: number;
}

export interface AddNoteRequest {
  content: string;
}

// ============================================
// Notification Types
// ============================================

export interface NotificationChannel {
  id: string;
  organizationId: string;
  type: NotificationType;
  name: string;
  config: NotificationConfig;
  enabled: boolean;
  createdAt: string;
}

export enum NotificationType {
  EMAIL = "EMAIL",
  SLACK = "SLACK",
  WEBHOOK = "WEBHOOK",
  PAGERDUTY = "PAGERDUTY"
}

export interface NotificationConfig {
  webhookUrl?: string;
  email?: string;
  slackToken?: string;
  pagerdutyKey?: string;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  name: string;
  config: NotificationConfig;
}

// ============================================
// Dashboard & Saved Search Types
// ============================================

export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  config: DashboardConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardConfig {
  panels?: DashboardPanel[];
  layout?: string;
}

export interface DashboardPanel {
  id: string;
  type: string;
  title: string;
  dataSource?: string;
  config?: any;
}

export interface SavedSearch {
  id: string;
  organizationId: string;
  name: string;
  query: string;
  filters?: Record<string, any>;
  createdBy: string;
  createdAt: string;
}

export interface CreateDashboardRequest {
  name: string;
  config?: DashboardConfig;
}

export interface CreateSavedSearchRequest {
  name: string;
  query: string;
  filters?: Record<string, any>;
}

// ============================================
// Deploy Marker Types
// ============================================

export interface DeployMarker {
  id: string;
  organizationId: string;
  service: string;
  version: string;
  environment: string;
  commitSha?: string;
  deployedBy: string;
  deployedAt: string;
}

export interface CreateDeployRequest {
  service: string;
  version: string;
  environment: string;
  commitSha?: string;
}

// ============================================
// SLO Types
// ============================================

export interface SloDefinition {
  id: string;
  organizationId: string;
  name: string;
  service: string;
  indicatorType: string;
  targetPercent: number;
  windowDays: number;
  createdAt: string;
}

export interface SloStatus {
  service: string;
  totalRequests: number;
  errorCount: number;
  successRate: number;
  errorRate: number;
  meetsErrorSlo: boolean;
  meetsLatencySlo: boolean;
}

export interface CreateSloRequest {
  name: string;
  service: string;
  indicatorType: string;
  targetPercent: number;
  windowDays?: number;
}

// ============================================
// Replay Types
// ============================================

export interface ReplayExecution {
  id: string;
  traceId: string;
  organizationId: string;
  status: ReplayStatus;
  requestMethod?: string;
  requestUrl?: string;
  requestHeaders?: string;
  requestBody?: string;
  responseStatus?: number;
  responseBody?: string;
  executedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export enum ReplayStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

// ============================================
// Trace & Log Types
// ============================================

export interface Trace {
  trace_id: string;
  start_time: string;
  end_time: string;
  event_count: number;
  services: string[];
  root_service?: string;
  root_event?: string;
  root_status_code?: number;
  status?: string;
  status_code?: number;
  endpoint?: string;
  display_name?: string;
}

export interface TraceDetail {
  traceId: string;
  totalEvents: number;
  tree: TraceNode[];
}

export interface TraceNode {
  span_id: string;
  parent_span_id?: string;
  service_name: string;
  event_name: string;
  timestamp: number;
  payload: any;
  children: TraceNode[];
}

export interface LogEntry {
  timestamp: string;
  service_name: string;
  event_name: string;
  payload: string;
}

export interface MetricEntry {
  service_name: string;
  total_requests: number;
  errors: number;
  p99_latency: number;
}

// ============================================
// Service Map Types
// ============================================

export interface ServiceNode {
  name: string;
  calls: number;
  errors: number;
}

export interface ServiceEdge {
  source: string;
  target: string;
  callCount: number;
  avgDuration: number;
  errorCount: number;
}

export interface ServiceMap {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
}

export interface AnomalyTrend {
  date: string;
  service: string;
  totalEvents: number;
  serverErrors: number;
  clientErrors: number;
  avgLatency: number;
  p99Latency: number;
}

// ============================================
// API Key Audit Log Types
// ============================================

export interface ApiKeyAuditLog {
  id: string;
  organizationId: string;
  apiKeyId: string;
  action: ApiKeyAuditAction;
  metadata?: Record<string, any>;
  performedAt: string;
}

export enum ApiKeyAuditAction {
  CREATED = "CREATED",
  ROTATED = "ROTATED",
  REVOKED = "REVOKED",
  USED = "USED"
}

// ============================================
// Event Types (Kafka)
// ============================================

export enum EventType {
  LOG = "LOG",
  TRACE = "TRACE",
  METRIC = "METRIC",
  ALERT = "ALERT",
  REPLAY = "REPLAY"
}

export interface IEvent {
  eventId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  tenantId: string;
  type: EventType;
  service: string;
  name: string;
  timestamp: number;
  payload: Record<string, any>;
}