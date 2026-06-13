# Galecto Platform Enhancement Tasks

> **Status Tracking Document** — Comprehensive implementation plan for all 15 enhancement tasks.
> **Last Updated:** 2026-06-13
> **Mandate:** No shallow implementation. All tasks must be fully functional and must not break existing functionality.

---

## Table of Contents

1. [Phase 1 – Critical Fixes](#phase-1--critical-fixes)
   - Task 6: Execute Replay Fix
   - Task 7: Alert Error Visibility Improvements
   - Task 5: Causality Tree Improvements
   - Task 4: Request Tracing Table Improvements
2. [Phase 2 – Dashboard Enhancements](#phase-2--dashboard-enhancements)
   - Task 1: Metrics API Anomaly Detection
   - Task 2: Temporal Event Velocity Hover Details
   - Task 3: Trace API Service Mapping
   - Task 10: Application Health Monitoring
3. [Phase 3 – Performance Improvements](#phase-3--performance-improvements)
   - Task 9: High Traffic Performance Optimization
   - Task 10b: Live Monitoring Enhancements
4. [Phase 4 – Settings & Security](#phase-4--settings--security)
   - Task 12: Team Member Invitation Workflow
   - Task 13: Favorites Feature
   - Task 14: Two-Factor Authentication (2FA)
   - Task 15: Session Timeout Management
5. [Phase 5 – Developer Experience](#phase-5--developer-experience)
   - Task 11: Developer Hub Documentation & Code Snippets

---

## Legend

- [ ] Pending — Not started
- [~] In Progress — Currently being implemented
- [x] Completed — Implemented, tested, and verified
- [!] Blocked — Waiting on dependency or external input

---

## Phase 1 – Critical Fixes

### Task 6: Execute Replay Fix
**Status:** [ ] Pending  
**Priority:** Critical  
**Current Issue:** When clicking "Execute Replay", the error `Body cannot be empty` appears.  
**Root Cause Analysis:**
- In `apps/api-gateway/src/controllers/replay.controller.ts`, the replay extracts `method, url, headers, body` from the original payload.
- When `body` is `undefined` or `null`, the Axios request is constructed with `data: body` which causes Axios validation to fail with `Body cannot be empty`.
- Additionally, the original payload structure may not always contain `body` (e.g., GET requests), and the current code doesn't conditionally exclude the `data` property from the Axios config.

**Files to Modify:**
- `apps/api-gateway/src/controllers/replay.controller.ts` — Fix request payload construction
- `apps/api-gateway/src/services/replay-protection.ts` — Ensure body masking handles null/undefined safely
- `apps/frontend/src/app/replay/page.tsx` — Verify frontend passes correct parameters and handles errors gracefully

**Acceptance Criteria:**
- [ ] Replay execution works for traces with no body (GET requests).
- [ ] Replay execution works for traces with a body (POST/PUT requests).
- [ ] Replay execution correctly masks/redacts PII in the body before sending.
- [ ] No `Body cannot be empty` validation error occurs.
- [ ] Failed replay attempts show meaningful error messages in the UI.
- [ ] Existing replay history and polling logic remain functional.

---

### Task 7: Alert Error Visibility Improvements
**Status:** [ ] Pending  
**Priority:** Critical  
**Current Issue:** Alert notifications only show logout-related or generic information instead of actual errors.  
**Root Cause Analysis:**
- In `apps/alert-service/src/server.ts`, the Kafka consumer creates alerts with messages like `High Error Rate: ${event.service} returned status ${statusCode}`.
- The actual error details (message, stack trace, response body) from the event payload are not extracted and stored in the alert.
- The frontend `alerts/page.tsx` displays `alert.message`, but the message itself is generic and doesn't contain the actual application error.
- For `INGEST_LOG` events, the payload structure is nested (`payload.payload.attributes.status`), and the actual error message might be in `payload.message` or `payload.error`.

**Files to Modify:**
- `apps/alert-service/src/server.ts` — Extract actual error details from event payload when creating alerts
- `apps/alert-service/prisma/schema.prisma` — Add `errorType`, `errorDetails`, `endpoint` fields to `Alert` model (optional, if needed for filtering)
- `apps/frontend/src/app/alerts/page.tsx` — Display actual error message, error type, service name, timestamp, and endpoint
- `apps/api-gateway/prisma/schema.prisma` — Sync Alert model with new fields if schema changes

**Acceptance Criteria:**
- [ ] Alerts display the actual error message extracted from the event payload (e.g., `User not found`, `Database connection failed`).
- [ ] Alerts display the error type (`ERROR`, `LATENCY`, `TIMEOUT`).
- [ ] Alerts display the service name that triggered the error.
- [ ] Alerts display the timestamp.
- [ ] Alerts display the affected endpoint/URL if available.
- [ ] Alert severity is correctly calculated based on status code and error type.
- [ ] Existing alert resolution flow remains functional.
- [ ] No existing alerts are broken by schema changes.

---

### Task 5: Causality Tree Improvements
**Status:** [ ] Pending  
**Priority:** Critical  
**Current Issue:** The tree currently displays internal log names like `INGEST_LOG`, `API_REQUEST`, `RESPONSE` instead of actual event names.  
**Root Cause Analysis:**
- In `apps/query-service/src/controllers/trace.controller.ts`, the `getTraceDetails` query returns raw `event_name` from ClickHouse.
- Events ingested via the API Gateway are stored with `name: "INGEST_LOG"` (see `apps/api-gateway/src/routes/index.ts` line 77).
- Trace events from OpenTelemetry might have names like `RESPONSE` or `API_REQUEST`.
- The actual business event name is usually inside `payload.event` or `payload.name`.
- The `TraceGraph.tsx` component renders `event_name` directly without attempting to resolve the meaningful name from the payload.
- The tree layout doesn't visually emphasize parent-child hierarchy depth.

**Files to Modify:**
- `apps/query-service/src/controllers/trace.controller.ts` — Add `display_name` extraction logic in `getTraceDetails` that resolves the actual event name from payload
- `apps/frontend/src/components/TraceGraph.tsx` — Improve node rendering to show meaningful event names, hierarchy depth, and visual parent-child indicators
- `apps/frontend/src/app/traces/page.tsx` — Ensure trace tree data structure supports the enhanced display

**Acceptance Criteria:**
- [ ] Tree nodes display actual event names (e.g., `ORDER_CREATED`, `UserLogin`, `PaymentProcessed`) instead of `INGEST_LOG`.
- [ ] If the actual event name is not available in the payload, fall back to `event_name` with a `[system]` prefix.
- [ ] The tree visually shows parent-child relationships (connecting lines, indentation, or depth-based styling).
- [ ] The tree hierarchy is clearly distinguishable (root spans vs child spans).
- [ ] The `TraceGraph` component remains performant for traces with up to 100 events.
- [ ] Clicking a node still shows the span insight panel with payload details.

---

### Task 4: Request Tracing Table Improvements
**Status:** [ ] Pending  
**Priority:** Critical  
**Current Issue:** The trace list only shows `trace_id`, `event_count`, `services`, and `start_time`. It lacks service name, application name, endpoint, request status, and proper timestamp.  
**Root Cause Analysis:**
- In `apps/query-service/src/controllers/trace.controller.ts`, the `listTraces` query aggregates only basic fields.
- The ClickHouse `events` table has `service_name`, `status_code`, and `payload` (which may contain `url` or `endpoint`).
- The frontend `traces/page.tsx` `Trace` interface doesn't include these fields.
- The `Recent Activity Stream` table on the dashboard (`dashboard/page.tsx`) also uses the same limited data.

**Files to Modify:**
- `apps/query-service/src/controllers/trace.controller.ts` — Enhance `listTraces` to return `root_service`, `application_name`, `endpoint`, `status`, and formatted `timestamp`
- `packages/api-types/src/index.ts` — Update the `Trace` interface to include new fields
- `apps/frontend/src/app/traces/page.tsx` — Update the trace list UI to display the new columns
- `apps/frontend/src/app/dashboard/page.tsx` — Update the Recent Activity Stream table to display meaningful columns

**Acceptance Criteria:**
- [ ] The trace table displays the actual root service name (first service in the trace or the service with `parent_span_id` empty).
- [ ] The trace table displays the application name (extracted from payload or a dedicated field).
- [ ] The trace table displays the endpoint/URL (extracted from payload for HTTP request events).
- [ ] The trace table displays the request status (HTTP status code, or `SUCCESS`/`ERROR` derived from status_code).
- [ ] The trace table displays a human-readable timestamp.
- [ ] The trace table is sortable and filterable by service and status.
- [ ] The dashboard Recent Activity Stream is also updated with the same improvements.
- [ ] Existing trace detail view continues to work correctly.

---

## Phase 2 – Dashboard Enhancements

### Task 1: Metrics API Anomaly Detection
**Status:** [ ] Pending  
**Priority:** High  
**Objective:** Improve anomaly visibility within the Metrics Dashboard.  
**Requirements:**
- Detect and display anomalies in metrics data.
- Show total anomaly/error count.
- Highlight affected metrics.
- Display error details related to each anomaly.

**Files to Modify:**
- `apps/query-service/src/controllers/trace.controller.ts` — Add `/api/v1/traces/anomalies-summary` endpoint that returns aggregated anomaly data
- `apps/frontend/src/app/dashboard/page.tsx` — Add anomaly detection display section with affected metrics, error counts, and error details
- `apps/frontend/src/app/monitoring/page.tsx` — Add anomaly indicators to the service metrics cards

**Acceptance Criteria:**
- [ ] A new API endpoint returns anomaly summary data (total anomalies, affected services, error details).
- [ ] The dashboard displays a visible anomaly count badge.
- [ ] Affected metrics are highlighted in red or with an alert icon.
- [ ] Users can expand to see error details for each anomaly (status code, error message, timestamp).
- [ ] Anomaly detection logic correctly identifies metrics with >5% error rate or >500ms latency spikes.
- [ ] The anomaly section updates automatically on dashboard refresh.

---

### Task 2: Temporal Event Velocity Hover Details
**Status:** [ ] Pending  
**Priority:** High  
**Objective:** Improve event visibility in the Temporal Event Velocity section.  
**Requirements:**
- On hover, display actual event name, event details, and related metadata.

**Files to Modify:**
- `apps/frontend/src/app/dashboard/page.tsx` — Enhance the ECharts tooltip formatter to show actual event names and metadata
- `apps/query-service/src/controllers/trace.controller.ts` — Enhance the trace list endpoint to return event metadata for the chart

**Acceptance Criteria:**
- [ ] Hovering over a bar in the Temporal Event Velocity chart shows a tooltip with the actual event name(s).
- [ ] The tooltip displays event count, time range, and top services involved.
- [ ] The tooltip displays related metadata (e.g., status codes, latency) if available.
- [ ] The chart remains responsive and doesn't lag on hover.

---

### Task 3: Trace API Service Mapping
**Status:** [ ] Pending  
**Priority:** High  
**Objective:** Display meaningful service information instead of generic identifiers.  
**Requirements:**
- Show actual service name and associated application name.
- Map traces to the connected application.

**Files to Modify:**
- `apps/query-service/src/controllers/trace.controller.ts` — Add service-to-application mapping in trace responses
- `apps/frontend/src/app/traces/page.tsx` — Display service and application names in trace details
- `apps/frontend/src/components/TraceGraph.tsx` — Show service name and application name on nodes

**Acceptance Criteria:**
- [ ] Traces show the actual service name (e.g., `Login Service`, `Order Service`).
- [ ] Traces show the associated application name (e.g., `E-Commerce App`).
- [ ] The trace detail view maps the trace to the connected application.
- [ ] Service mapping is consistent across Dashboard, Traces, and Monitoring pages.

---

### Task 10: Application Health Monitoring
**Status:** [ ] Pending  
**Priority:** High  
**Objective:** Display health status for all connected applications.  
**Requirements:**
- Supported statuses: `Healthy`, `Warning`, `Critical`, `Offline`.
- Centralized application health monitoring.

**Files to Modify:**
- `apps/api-gateway/src/controllers/health.controller.ts` — Add application-level health checks with status classification
- `apps/frontend/src/app/monitoring/page.tsx` — Add an application health grid with status badges
- `apps/frontend/src/app/status/page.tsx` — Enhance the status page to show application health in addition to infrastructure health

**Acceptance Criteria:**
- [ ] Health statuses are calculated based on error rate, latency, and last seen timestamp.
- `Healthy`: Error rate < 1%, latency < 200ms, seen in last 5 minutes.
- `Warning`: Error rate 1-5%, latency 200-500ms, or not seen in 5-15 minutes.
- `Critical`: Error rate > 5%, latency > 500ms, or not seen in 15-30 minutes.
- `Offline`: Not seen in > 30 minutes.
- [ ] The health status is visible on the Monitoring dashboard.
- [ ] The health status auto-refreshes every 30 seconds.
- [ ] Clicking a health status shows detailed breakdown of the metrics behind the status.

---

## Phase 3 – Performance Improvements

### Task 9: High Traffic Performance Optimization
**Status:** [ ] Pending  
**Priority:** High  
**Current Issue:** When more than 2000+ Metrics API requests are processed, the browser becomes slow and the application lags.  
**Requirements:**
- Optimize frontend rendering.
- Implement pagination, virtual scrolling, lazy loading, data aggregation, and efficient state management.

**Files to Modify:**
- `apps/frontend/src/app/dashboard/page.tsx` — Implement pagination for traces, virtual scrolling for large lists, data aggregation for charts
- `apps/frontend/src/app/monitoring/page.tsx` — Implement virtual scrolling for service metrics, lazy loading for detailed metrics
- `apps/frontend/src/app/traces/page.tsx` — Implement virtual scrolling for the trace list, pagination for trace details
- `apps/frontend/src/lib/apiClient.ts` — Add request debouncing and caching for high-frequency metric requests
- `apps/query-service/src/controllers/trace.controller.ts` — Add pagination support to `listTraces` and `getPerformanceMetrics`

**Acceptance Criteria:**
- [ ] The dashboard remains responsive with 2000+ metrics records.
- [ ] Trace lists use virtual scrolling or pagination (max 50 items per page).
- [ ] Chart data is aggregated server-side when record count exceeds 1000.
- [ ] API requests are debounced (min 500ms between identical requests).
- [ ] Client-side caching stores metrics for 30 seconds to prevent redundant API calls.
- [ ] Memory usage does not grow unboundedly with large datasets.
- [ ] Existing functionality (refresh, filtering, detail view) works with pagination.

---

### Task 10b: Live Monitoring Enhancements
**Status:** [ ] Pending  
**Priority:** Medium  
**Objective:** Complement Phase 3 with live monitoring-specific improvements.  
**Requirements:**
- Real-time WebSocket or SSE updates for high-traffic metrics.
- Adaptive refresh rate (slower when idle, faster when anomalies detected).

**Files to Modify:**
- `apps/frontend/src/app/monitoring/page.tsx` — Add SSE or polling with adaptive refresh
- `apps/api-gateway/src/server.ts` — Add SSE endpoint for real-time metrics streaming

**Acceptance Criteria:**
- [ ] Metrics update in real-time without full page reload.
- [ ] Refresh rate adapts based on traffic (10s when normal, 2s when anomalies detected).
- [ ] Browser CPU usage remains low during high traffic.

---

## Phase 4 – Settings & Security

### Task 12: Team Member Invitation Workflow
**Status:** [ ] Pending  
**Priority:** High  
**Requirements:**
- When a member is added via email, send an invitation email automatically with an acceptance link.
- Display a "Pending" badge until accepted.
- After acceptance, remove the pending badge and mark the member as Active.

**Files to Modify:**
- `apps/auth-service/prisma/schema.prisma` — Add `Invitation` model with `email`, `role`, `token`, `status`, `expiresAt`, `organizationId`
- `apps/auth-service/src/server.ts` — Add invitation creation endpoint and acceptance endpoint
- `apps/alert-service/src/notifiers/EmailNotifier.ts` — Add invitation email template
- `apps/frontend/src/app/settings/page.tsx` — Update team members UI to show pending/active status
- `apps/api-gateway/src/routes/auth.routes.ts` — Add invitation endpoints to gateway

**Acceptance Criteria:**
- [ ] Inviting a user sends an email with a secure acceptance link.
- [ ] The invited user appears in the team list with a "Pending" badge.
- [ ] The acceptance link expires after 24 hours.
- [ ] Clicking the acceptance link creates the user account and marks them as Active.
- [ ] The inviter receives a notification when the invitation is accepted.
- [ ] Existing user management (remove user) works for both pending and active users.
- [ ] No duplicate invitations can be sent to the same email for the same organization.

---

### Task 13: Favorites Feature
**Status:** [ ] Pending  
**Priority:** Medium  
**Requirements:**
- Allow users to add items to favorites, remove items, and view favorite items.

**Files to Modify:**
- `apps/api-gateway/prisma/schema.prisma` — Add `Favorite` model with `userId`, `itemType`, `itemId`, `createdAt`
- `apps/api-gateway/src/routes/index.ts` — Add CRUD endpoints for favorites
- `apps/frontend/src/components/DashboardLayout.tsx` — Add a "Favorites" quick-access sidebar or dropdown
- `apps/frontend/src/app/dashboard/page.tsx` — Add favorite/star button to traces and services
- `apps/frontend/src/app/traces/page.tsx` — Add favorite/star button to trace items

**Acceptance Criteria:**
- [ ] Users can favorite traces, services, and alert rules.
- [ ] Favorited items are accessible from a global "Favorites" panel.
- [ ] Users can unfavorite items from the same panel or from the original location.
- [ ] Favorites are persisted per user and per organization.
- [ ] The favorites panel updates immediately without page reload.

---

### Task 14: Two-Factor Authentication (2FA)
**Status:** [ ] Pending  
**Priority:** High  
**Requirements:**
- Implement 2FA support with Email OTP and Authenticator App (TOTP).
- Require verification during login.

**Files to Modify:**
- `apps/auth-service/prisma/schema.prisma` — Add `twoFactorEnabled`, `twoFactorSecret`, `twoFactorMethod` to `User` model
- `apps/auth-service/src/server.ts` — Add 2FA setup, verification, and login endpoints
- `apps/frontend/src/app/login/page.tsx` — Add 2FA verification step after password login
- `apps/frontend/src/app/settings/page.tsx` — Add 2FA setup UI in Security tab
- `apps/alert-service/src/notifiers/EmailNotifier.ts` — Add OTP email template

**Acceptance Criteria:**
- [ ] Users can enable 2FA via Email OTP or Authenticator App.
- [ ] When enabling Authenticator App, a QR code is displayed for scanning.
- [ ] Login requires 2FA code after successful password verification.
- [ ] Email OTPs are 6-digit codes valid for 10 minutes.
- [ ] Users can disable 2FA after confirming their password.
- [ ] Recovery codes are generated and displayed when 2FA is enabled.
- [ ] Existing users without 2FA can still log in normally.

---

### Task 15: Session Timeout Management
**Status:** [ ] Pending  
**Priority:** High  
**Requirements:**
- Implement automatic session expiration.
- Display warning before timeout.
- Auto logout inactive users.
- Require re-authentication after expiration.

**Files to Modify:**
- `apps/auth-service/prisma/schema.prisma` — Add `lastActivityAt` to `User` or track sessions in a `Session` model
- `apps/auth-service/src/server.ts` — Add session validation and activity tracking endpoints
- `apps/frontend/src/context/AuthContext.tsx` — Add session timeout tracking, warning modal, and auto-logout
- `apps/frontend/src/components/DashboardLayout.tsx` — Integrate session timeout warning

**Acceptance Criteria:**
- [ ] Sessions expire after a configurable period of inactivity (default 30 minutes).
- [ ] A warning modal appears 2 minutes before session expiration.
- [ ] Users can extend the session by clicking "Stay Logged In".
- [ ] If no action is taken, the user is automatically logged out and redirected to login.
- [ ] The session timer resets on any user activity (mouse move, key press, click).
- [ ] The session timeout is configurable in the Settings > Security tab.
- [ ] JWT tokens are invalidated on the server when the session expires.

---

## Phase 5 – Developer Experience

### Task 11: Developer Hub Documentation & Code Snippets
**Status:** [ ] Pending  
**Priority:** Medium  
**Current Issue:** The Developer Hub contains placeholder SDK snippets (`@galecto/sdk` which doesn't exist yet) and incomplete API documentation.  
**Requirements:**
- Replace placeholder snippets with actual implementation code.
- Provide backend integration examples.
- Provide configuration examples, setup instructions, and API usage documentation.

**Files to Modify:**
- `apps/frontend/src/app/developer/page.tsx` — Complete rewrite with actual SDK code, real API examples, and step-by-step setup instructions
- `packages/api-types/src/index.ts` — Ensure all API types are documented and exported
- `README.md` — Add integration guide

**Acceptance Criteria:**
- [ ] The Developer Hub provides actual working Node.js integration code (using the existing REST API, not a fictional SDK).
- [ ] The Developer Hub provides actual working Python integration code.
- [ ] The Developer Hub provides actual working Go integration code.
- [ ] Each integration example includes installation, initialization, sending traces, sending logs, and error handling.
- [ ] API reference includes all endpoints with request/response examples.
- [ ] Configuration examples include environment variables, API key setup, and service naming conventions.
- [ ] Setup instructions include Docker Compose, local development, and production deployment.
- [ ] No fictional SDK references (e.g., `@galecto/sdk`) unless the SDK actually exists in the repository.

---

## Technical Implementation Notes

### Database Schema Changes
Any Prisma schema changes require:
1. Updating the schema in the relevant service.
2. Running `npx prisma migrate dev` or `npx prisma db push` to apply changes.
3. Running `npx prisma generate` to regenerate the client.
4. Updating the corresponding API types in `packages/api-types/src/index.ts`.
5. Ensuring the frontend types match the API response.

### ClickHouse Schema Changes
The `events` table is created in `packages/clickhouse/src/client.ts`. If new columns are needed:
1. Update the `CREATE TABLE` statement in `initializeClickHouseSchemas()`.
2. Run the initialization function to apply the schema.
3. Note: ClickHouse `ALTER TABLE` may be required for existing deployments.

### Frontend State Management
- Use React hooks (`useState`, `useCallback`, `useMemo`, `useRef`) for local state.
- Use `useEffect` for data fetching with proper cleanup.
- Implement debouncing for high-frequency updates.
- Use `AbortController` for cancellable requests.

### API Gateway Routing
- New endpoints should be registered in `apps/api-gateway/src/routes/index.ts`.
- Protected endpoints should use `jwtAuthMiddleware` or `authMiddleware`.
- Gateway routes should forward to the appropriate backend service.

---

## Regression Testing Checklist

After each phase, verify the following existing functionality:
- [ ] User login and logout work correctly.
- [ ] Dashboard loads and shows metrics.
- [ ] Trace list loads and trace details open.
- [ ] Replay execution works (after Task 6 fix).
- [ ] Alerts load, create, and resolve correctly.
- [ ] Settings page loads and saves organization settings.
- [ ] API key creation and copying work.
- [ ] Developer Hub page loads.
- [ ] Status page shows service health.
- [ ] All navigation links work.
