# Galecto Platform - Complete User Guide

**Version 1.0 | Enterprise Observability Platform**

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Getting Started](#2-getting-started)
3. [Authentication](#3-authentication)
4. [Dashboard Overview](#4-dashboard-overview)
5. [Traces & Causality](#5-traces--causality)
6. [Logs Explorer](#6-logs-explorer)
7. [System Monitoring](#7-system-monitoring)
8. [Alerts & Incidents](#8-alerts--incidents)
9. [Replay Feature](#9-replay-feature)
10. [Project Management](#10-project-management)
11. [API Keys](#11-api-keys)
12. [Notifications](#12-notifications)
13. [Dashboards & Saved Searches](#13-dashboards--saved-searches)
14. [SLOs & Burn Rate](#14-slos--burn-rate)
15. [Deploy Markers](#15-deploy-markers)
16. [Settings & Retention](#16-settings--retention)
17. [OTLP Integration](#17-otlp-integration)
18. [API Reference](#18-api-reference)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Platform Overview

### What is Galecto?

Galecto is an **enterprise-grade observability platform** combining:
- **Distributed Tracing** - Track requests across services
- **Log Aggregation** - Search and analyze logs
- **Metrics & Monitoring** - Real-time system health
- **Alert Management** - Incident tracking with SLA
- **Replay Feature** - Reproduce issues for debugging
- **SLO Tracking** - Monitor service level objectives

### Architecture

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Web UI |
| API Gateway | 3001 | Ingress, Replay, OTLP |
| Auth Service | 4000 | Authentication, RBAC |
| Log Service | 4001 | Kafka → ClickHouse |
| Query Service | 4002 | Traces, Logs, Metrics |
| Alert Service | 5003 | Alert Detection |

---

## 2. Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL (localhost:5432)
- Redis (localhost:6379)
- Kafka (localhost:9092)
- ClickHouse (localhost:8123)

### Installation Steps

```bash
# Clone & Install
git clone <repo-url> galecto
cd galecto
npm install

# Setup Database
cd apps/auth-service
npx prisma generate
npx prisma db push

# Start Services
cd ../..
npm run dev:all

# Access Platform
# Open browser: http://localhost:3000
```

---

## 3. Authentication

### User Roles

| Role | Permissions |
|------|-------------|
| OWNER | Full access, can delete organization |
| ADMIN | Manage projects, keys, settings |
| DEVELOPER | Create resources, view all data |
| OBSERVER | Read-only access |

### Registration
1. Go to `http://localhost:3000/register`
2. Enter email, password, organization name
3. Click "Create Account"
4. Automatically redirected to dashboard

### Login
1. Go to `http://localhost:3000/login`
2. Enter credentials
3. JWT token stored in localStorage

---

## 4. Dashboard Overview

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | /dashboard | Main overview |
| Traces | /traces | Distributed tracing |
| Logs | /logs | Log search |
| Monitoring | /monitoring | System metrics |
| Alerts | /alerts | Incident management |
| Replay | /replay | Request replay |
| Settings | /settings | Projects, keys, retention |

---

## 5. Traces & Causality

### View Traces
Go to: `http://localhost:3000/traces`

### Features
- List of recent traces with timestamps
- Click to see causality tree
- View span relationships
- Filter by service

### Anomalies
- Filter by error status (4xx, 5xx)
- Filter by high latency (>500ms)

---

## 6. Logs Explorer

### Search Options
- **Text Search** - Search in message/payload
- **Service Filter** - Filter by service name
- **Time Range** - Filter by timestamp

---

## 7. System Monitoring

### Metrics Available
- Total Requests
- P99 Latency
- Error Rate
- Cluster Health

---

## 8. Alerts & Incidents

### Alert Types
| Type | Trigger |
|------|---------|
| ERROR | HTTP status >= 400 |
| LATENCY | Response time > 500ms |

### Severity Levels
- CRITICAL, HIGH, MEDIUM, LOW, INFO

### Incident Lifecycle
1. ACTIVE → ACKNOWLEDGED → RESOLVED

---

## 9. Replay Feature

### Safety Features
- PII Masking
- Header Filtering
- URL Allowlist
- Redaction

---

## 10. Project Management

### Project Environments
- DEVELOPMENT
- STAGING
- PRODUCTION

---

## 11. API Keys

### Key Scopes
| Scope | Purpose |
|-------|---------|
| ingest | Send telemetry |
| read | Query data |
| write | Create resources |

### Operations
```bash
POST /projects/keys/:id/rotate  # Rotate key
POST /projects/keys/:id/revoke   # Revoke key
GET  /projects/keys/audit-logs   # View history
```

---

## 12. Notifications

### Supported Channels
- Email
- Slack
- Webhook
- PagerDuty

---

## 13. Dashboards & Saved Searches

### Operations
```bash
GET /dashboards              # List dashboards
POST /dashboards             # Create dashboard
GET /dashboards/searches    # List saved searches
```

---

## 14. SLOs & Burn Rate

### Indicator Types
- error_rate
- latency
- availability

---

## 15. Deploy Markers

```bash
POST /platform/deploys
{
  "service": "api-gateway",
  "version": "1.2.3",
  "environment": "production",
  "commitSha": "abc123"
}
```

---

## 16. Settings & Retention

### Retention Options
- 7 Days
- 14 Days
- 30 Days (default)
- 90 Days

---

## 17. OTLP Integration

### Endpoints
| Data Type | Endpoint |
|-----------|-----------|
| Traces | POST /v1/traces |
| Metrics | POST /v1/metrics |
| Logs | POST /v1/logs |

---

## 18. API Reference

### Base URLs
| Service | URL |
|---------|-----|
| Auth Service | http://localhost:4000 |
| API Gateway | http://localhost:3001 |
| Query Service | http://localhost:4002 |

### Core Endpoints

**Auth Service**
```bash
POST /auth/register
POST /auth/login
POST /auth/verify-api-key
```

**Projects**
```bash
GET /projects
POST /projects
POST /projects/:id/keys
```

**Query Service**
```bash
GET /api/v1/traces
GET /api/v1/logs
GET /api/v1/service-map
GET /api/v1/slo-status
```

---

## 19. Troubleshooting

### Common Issues

**Services Won't Start**
```bash
# Check dependencies
pg_isready -h localhost -p 5432
redis-cli ping
```

**Database Connection**
- Verify DATABASE_URL in .env

**JWT Token Expired**
- Re-login to get new token

**No Data in Traces/Logs**
- Check Kafka is running
- Verify ingest endpoint receiving data

### Run Tests
```bash
npx playwright install --with-deps chromium
npm run test:integration
```

---

*Galecto Platform - Enterprise Observability with Causality Replay*
*Version 1.0*