# Phase 10: Launch Checklist (Day 14)

## Objective
Final testing, deployment preparation, and go-live.

---

## 10.1 Final Integration Test

### Morning: Run Complete Test Suite

```bash
# 1. Start all infrastructure
docker-compose -f infra/docker-compose.yml up -d
sleep 30

# 2. Start all services (in separate terminals)
# Terminal 1
cd apps/api-gateway && npm run dev
# Terminal 2
cd apps/auth-service && npm run dev
# Terminal 3
cd apps/log-service && npm run dev
# Terminal 4
cd apps/query-service && npm run dev
# Terminal 5
cd apps/alert-service && npm run dev
# Terminal 6
cd apps/frontend && npm run dev
```

### Test Commands

```bash
# 3. Verify health endpoints
curl http://localhost:3001/health
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:5003/health

# 4. Test authentication
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# 5. Test ingest
curl -X POST http://localhost:3001/api/v1/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "x-service: test-app" \
  -d '{"service":"test-app","event":"LOG","payload":{"level":"info","message":"Test log"}}'

# 6. Test query service (with JWT)
curl http://localhost:4002/api/v1/traces \
  -H "Authorization: Bearer <token>"

curl http://localhost:4002/api/v1/logs \
  -H "Authorization: Bearer <token>"

# 7. Test alert rules
curl -X POST http://localhost:4000/api/v1/platform/rules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Alert",
    "conditionType":"ERROR_RATE",
    "conditionValue":{"threshold":400,"operator":">=","windowMinutes":5},
    "severity":"HIGH",
    "services":["api-gateway"]
  }'

# 8. Test notification channels
curl -X POST http://localhost:4000/api/v1/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"SLACK",
    "name":"#alerts",
    "config":{"webhook_url":"https://hooks.slack.com/services/XXX"}
  }'

# 9. Verify frontend
curl http://localhost:3000
```

---

## 10.2 Pre-Launch Checklist

### Infrastructure
- [ ] Docker Compose starts all services
- [ ] PostgreSQL accessible
- [ ] Redis accessible
- [ ] Kafka accessible
- [ ] ClickHouse accessible
- [ ] All health checks pass

### Backend Services
- [ ] API Gateway (3001) running
- [ ] Auth Service (4000) running
- [ ] Log Service (4001) running
- [ ] Query Service (4002) running
- [ ] Alert Service (5003) running
- [ ] JWT authentication works
- [ ] API key validation works
- [ ] Ingest endpoint accepts events
- [ ] Kafka consumers process events
- [ ] ClickHouse stores events
- [ ] Query service returns data

### Alert System
- [ ] Alert rules can be created
- [ ] Alert rules can be updated
- [ ] Alert rules can be deleted
- [ ] Alert evaluation triggers correctly
- [ ] Slack notifications work
- [ ] Teams notifications work
- [ ] Email notifications work
- [ ] Execution history recorded

### Frontend
- [ ] Dashboard loads with real metrics
- [ ] Monitoring shows real health
- [ ] Traces page loads real data
- [ ] Logs page loads real data
- [ ] Alert rules UI works
- [ ] Notifications UI works
- [ ] Replay history loads
- [ ] No placeholder data remains
- [ ] Developer docs complete

### SDK
- [ ] SDK published to npm
- [ ] SDK has batching
- [ ] SDK has retry logic
- [ ] SDK works with ESM
- [ ] Express middleware works

---

## 10.3 Deployment Preparation

### Environment Variables

```env
# API Gateway
PORT=3001
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-production-secret-here
DATABASE_URL=postgresql://user:pass@host:5432/galecto
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=galecto
AUTH_SERVICE_URL=http://auth-service:4000

# Auth Service
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/galecto
JWT_SECRET=your-production-secret-here

# Log Service
PORT=4001
KAFKA_BROKER=kafka:9092
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# Query Service
PORT=4002
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=galecto
JWT_SECRET=your-production-secret-here

# Alert Service
PORT=5003
DATABASE_URL=postgresql://user:pass@host:5432/galecto
JWT_SECRET=your-production-secret-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/XXX
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@galecto.io
SMTP_PASSWORD=your-smtp-password
ALERT_EMAIL_RECIPIENTS=ops@company.com,dev@company.com

# Frontend
NEXT_PUBLIC_API_URL=http://api-gateway:3001
NEXT_PUBLIC_QUERY_URL=http://query-service:4002
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  # Infrastructure
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: galecto
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - galecto

  redis:
    image: redis:7-alpine
    networks:
      - galecto

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    networks:
      - galecto

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - galecto

  clickhouse:
    image: clickhouse/clickhouse-server:23.8-alpine
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    networks:
      - galecto

  # Application Services
  api-gateway:
    build: ./apps/api-gateway
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      - postgres
      - redis
      - kafka
    networks:
      - galecto

  auth-service:
    build: ./apps/auth-service
    env_file: .env
    depends_on:
      - postgres
      - redis
    networks:
      - galecto

  log-service:
    build: ./apps/log-service
    env_file: .env
    depends_on:
      - kafka
      - clickhouse
    networks:
      - galecto

  query-service:
    build: ./apps/query-service
    env_file: .env
    depends_on:
      - clickhouse
    networks:
      - galecto

  alert-service:
    build: ./apps/alert-service
    env_file: .env
    depends_on:
      - postgres
      - kafka
    networks:
      - galecto

  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    env_file: .env
    networks:
      - galecto

volumes:
  postgres_data:
  clickhouse_data:

networks:
  galecto:
    driver: bridge
```

---

## 10.4 Go-Live Steps

### Checklist

- [ ] All services tested
- [ ] All features verified
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] Frontend accessible
- [ ] SDK published

### Announcement

```
🚀 Galecto Observability Platform is now LIVE!

Features:
✅ Log collection & search
✅ Distributed tracing
✅ Real-time alerting
✅ Multi-channel notifications (Slack, Teams, Email)
✅ Request replay for debugging
✅ SDK for application integration

Get started: npm install @prakhar2818/galecto-sdk
```

---

## SUCCESS! Platform Launched 🎉

---

# APPENDIX: Quick Reference

## Service URLs

| Service | URL | Health |
|---------|-----|--------|
| Frontend | http://localhost:3000 | - |
| API Gateway | http://localhost:3001 | /health |
| Auth Service | http://localhost:4000 | /health |
| Log Service | http://localhost:4001 | /health |
| Query Service | http://localhost:4002 | /health |
| Alert Service | http://localhost:5003 | /health |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/signup | Register |
| POST | /api/v1/ingest | Ingest telemetry |
| GET | /api/v1/traces | List traces |
| GET | /api/v1/logs | List logs |
| GET | /api/v1/traces/metrics | Get metrics |
| GET | /api/v1/platform/rules | List alert rules |
| POST | /api/v1/platform/rules | Create alert rule |
| GET | /api/v1/notifications | List channels |
| POST | /api/v1/notifications | Create channel |
| GET | /api/v1/replays | List replays |

## Commands

```bash
# Start infrastructure
docker-compose -f infra/docker-compose.yml up -d

# Start all services
npm run dev:all

# Build for production
npm run build --workspaces

# Deploy
# Production Docker Compose with env vars configured
```
