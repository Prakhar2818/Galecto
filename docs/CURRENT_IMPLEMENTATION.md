# Antigravity: Enterprise Observability & Replay Platform
**Current Implementation Status (Post-Emerald Upgrade)**

This document outlines the state of the Antigravity platform following the "Emerald Soft" transformation. The platform has evolved from a simple distributed tracer into a high-fidelity SaaS observability engine with causality replay.

## 1. Core Architecture (The Engine)
Antigravity utilizes a **Distributed Event Streaming Architecture** built for sub-second ingestion and recursive causality reconstruction.

### The Tech Stack
*   **Edge Gateway:** Node.js + Fastify (Port 3001)
*   **Microservices:** Auth (5001), Log (5002), Query (4002)
*   **Data Backbone:** Apache Kafka (Streaming), ClickHouse (OLAP), PostgreSQL (Metadata)
*   **Frontend:** Next.js 14 (Sora + Inter Typography), React Flow, ECharts

---

## 2. Completed Implementation Phases

### ✅ Phase 1: SaaS Foundation & "Emerald" UI
*   **Emerald Soft Design System:** Implemented a premium, high-contrast design language.
*   **Typography:** SOC-2 compliant Sora headlines and Inter body text.
*   **Global Auth Context:** Implemented `AuthProvider` to manage JWT sessions and multi-tenant isolation.
*   **Unified API Client:** Created `apiClient.ts` with automatic JWT header injection and multi-service routing.

### ✅ Phase 2: Distributed Tracing & Causality Graph
*   **Hierarchical Stitching:** The `query-service` now reconstructs recursive request trees from flat ClickHouse spans.
*   **React Flow Visualization:** Interactive, animated causality graphs in the `/traces` workspace.
*   **Span Insights:** Deep-dive side panels for examining request payloads and cycle timestamps.

### ✅ Phase 3: Log Explorer & Deep Search
*   **OLAP Search:** Connected `/logs` to the ClickHouse `events` table via the Query Service.
*   **Filtering:** Real-time search by service, severity, and raw payload contents.
*   **Ingestion:** Verified Kafka-to-ClickHouse pipeline with batch-merge logic.

### ✅ Phase 4: The Replay Engine (The "Time Machine")
*   **Metadata Capture:** API Gateway updated to capture **full headers and body** for every request in ClickHouse.
*   **Shadow Proxy Logic:** Built `ReplayController` in the Gateway.
    *   Fetches original metadata from ClickHouse by `traceId`.
    *   Re-fires request in isolation with a `replay_` prefix.
*   **Replay Workspace:** Side-by-side comparison UI in `/replay` for verifying fixes by comparing original vs. replayed trace trees.

---

## 3. Deployment & Development
The environment is managed via a modular workspace structure:

| Service | Port | Responsibility |
| :--- | :--- | :--- |
| `api-gateway` | 3001 | Ingestion, Auth Edge, Replay Controller |
| `query-service` | 4002 | Trace Stitching, Log Search, Anomaly Detection |
| `auth-service` | 5001 | User/Org Metadata, JWT Issuance |
| `frontend` | 3000 | SaaS Dashboard, Visualizations |

---

## 4. Next Roadmap Goals
*   **Phase 5 (Alerting Service):** A standalone worker to process Kafka events and trigger thresholds (Slack/Email).
*   **Phase 6 (Live Monitoring):** Real-time "Pulse" visualizer using WebSockets for live cluster health.
