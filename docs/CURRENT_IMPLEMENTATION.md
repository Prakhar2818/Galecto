# Galecto: Enterprise Observability & Replay Platform
**Current Implementation Status (Post-Emerald Upgrade)**

This document outlines the state of the Galecto platform following the "Emerald Soft" transformation. The platform has evolved from a simple distributed tracer into a high-fidelity SaaS observability engine with causality replay.

## 1. Core Architecture (The Engine)
Galecto utilizes a **Distributed Event Streaming Architecture** built for sub-second ingestion and recursive causality reconstruction.

### The Tech Stack
*   **Edge Gateway:** Node.js + Fastify (Port 3001)
*   **Microservices:** Auth (5001), Log (5002), Query (4002), Alert (5003)
*   **Data Backbone:** Apache Kafka (Streaming), ClickHouse (OLAP), PostgreSQL (Metadata)
*   **Frontend:** Next.js 14 (Sora + Inter Typography), React Flow, ECharts

---

## 2. Completed Implementation Phases

### ✅ Phase 1: SaaS Foundation & "Emerald" UI
*   **Emerald Soft Design System:** Implemented a premium, high-contrast design language.
*   **Typography:** SOC-2 compliant Sora headlines and Inter body text.
*   **Global Auth Context:** Implemented `AuthProvider` to manage JWT sessions and multi-tenant isolation.
*   **Unified API Client:** Created `apiFetch`, `queryFetch`, and `alertFetch` with automatic JWT injection.

### ✅ Phase 2: Distributed Tracing & Causality Graph
*   **Hierarchical Stitching:** The `query-service` reconstructs recursive request trees from flat ClickHouse spans.
*   **React Flow Visualization:** Interactive, animated causality graphs in the `/traces` workspace.

### ✅ Phase 3: Log Explorer & Deep Search
*   **OLAP Search:** Connected `/logs` to the ClickHouse `events` table via the Query Service.
*   **Filtering:** Real-time search by service, severity, and raw payload contents.

### ✅ Phase 4: The Replay Engine (The "Time Machine")
*   **Metadata Capture:** API Gateway updated to capture **full headers and body** for every request in ClickHouse.
*   **Shadow Proxy Logic:** Built `ReplayController` in the Gateway with `x-galecto-replay` isolation headers.
*   **Replay Workspace:** Side-by-side comparison UI in `/replay`.

### ✅ Phase 5: Alerting Engine
*   **Kafka Consumer:** `alert-service` scans events for status code anomalies and latency spikes.
*   **Incident Center:** Real-time alerts dashboard with resolution capabilities.

### ✅ Phase 6: Live Monitoring
*   **Quantum Stream:** Real-time P99 latency and error rate analytics via ClickHouse aggregates.

### ✅ Phase 7: Workspace & Project Management
*   **Multi-Project:** Added support for creating multiple projects within an organization.
*   **Project-Specific Keys:** Implemented dynamic API key generation per project.

### ✅ Phase 8: Data Retention Policies
*   **Retention Worker:** Background cron job in `log-service` to automatically prune ClickHouse data.

### ✅ Phase 9: Developer Hub
*   **Developer Portal:** Centralized hub for documentation and copy-pasteable SDK snippets.

---

## 3. Deployment & Development
The environment is managed via a modular workspace structure:

| Service | Port | Responsibility |
| :--- | :--- | :--- |
| `api-gateway` | 3001 | Ingestion, Auth Edge, Replay Controller |
| `query-service` | 4002 | Trace Stitching, Log Search, P99 Metrics |
| `auth-service` | 5001 | User/Org Metadata, Projects, API Keys |
| `log-service` | 5002 | Kafka Consumption, ClickHouse Pruning |
| `alert-service` | 5003 | Real-time Anomaly Detection |
| `frontend` | 3000 | SaaS Dashboard, Visualizations |

---

## 4. Final System Status
**Status:** ALL PHASES COMPLETE ✅
**Name:** Galecto
**Branding:** Emerald Soft Design Language
