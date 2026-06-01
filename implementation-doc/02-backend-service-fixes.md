# Phase 2: Backend Service Fixes (Day 1 Afternoon - Day 2)

## Objective
Fix critical issues in query-service, api-gateway, and auth-service.

---

## 2.1 Fix Query Service (Day 1 Afternoon)

### Problem
- Missing `@fastify/jwt` dependency
- Missing environment variables
- CORS wildcard security issue
- `initializeClickHouseSchemas()` never called

### Files to Modify

#### `apps/query-service/package.json`

Add to `dependencies`:
```json
"@fastify/jwt": "^10.0.0"
```

#### `apps/query-service/src/app.ts`

```typescript
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import { traceController } from "./controllers/trace.controller";
import { logController } from "./controllers/log.controller";
import { serviceMapController } from "./controllers/service-map.controller";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "galecto-secret-change-in-production"
  });

  // Routes
  app.get("/api/v1/traces", async (req, reply) => traceController.listTraces(req, reply));
  app.get("/api/v1/traces/:traceId", async (req, reply) => traceController.getTraceDetails(req, reply));
  app.get("/api/v1/traces/anomalies", async (req, reply) => traceController.listAnomalies(req, reply));
  app.get("/api/v1/traces/metrics", async (req, reply) => traceController.getPerformanceMetrics(req, reply));
  app.get("/api/v1/logs", async (req, reply) => logController.listLogs(req, reply));
  app.get("/api/v1/service-map", async (req, reply) => serviceMapController.getServiceDependencies(req, reply));
  app.get("/api/v1/anomaly-trends", async (req, reply) => serviceMapController.getAnomalyTrends(req, reply));
  app.get("/api/v1/slo-status", async (req, reply) => serviceMapController.getSloStatus(req, reply));

  // Health check
  app.get("/health", async () => ({ status: "OK" }));

  return app;
}
```

#### `apps/query-service/src/server.ts`

```typescript
import "dotenv/config";
import { buildApp } from "./app";
import { initializeClickHouseSchemas } from "../../../../packages/clickhouse/src/client";

async function start() {
  // Initialize ClickHouse before starting server
  await initializeClickHouseSchemas();
  console.log("ClickHouse schemas initialized");

  const app = buildApp();
  const port = Number(process.env.PORT) || 4002;

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Query Service running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
```

#### `apps/query-service/.env`

```env
PORT=4002
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=galecto
JWT_SECRET=galecto-super-secret-key-change-in-production
```

### Commands

```bash
cd apps/query-service
npm install @fastify/jwt
npm run build
npm run dev
```

---

## 2.2 Fix API Gateway (Day 2 Morning)

### Problem
- Prisma schema mismatch in ReplayExecution
- Hardcoded localhost URL in replay controller
- Missing DATABASE_URL and ClickHouse env vars

### Files to Modify

#### `apps/auth-service/prisma/schema.prisma`

Update `ReplayExecution` model to add missing fields:

```prisma
model ReplayExecution {
  id              String   @id @default(uuid())
  organizationId  String
  traceId         String
  status          String   // PENDING, RUNNING, COMPLETED, FAILED
  requestMethod   String?
  requestUrl      String?
  requestHeaders  String?
  requestBody     String?
  responseStatus  Int?     // ADD THIS FIELD
  responseBody    String?  // ADD THIS FIELD
  executedAt      DateTime @default(now())
  completedAt     DateTime? // ADD THIS FIELD
  errorMessage    String?
  startTime       DateTime @default(now())
  endTime         DateTime?
  result          Json?
  createdAt       DateTime @default(now())

  @@index([organizationId])
  @@index([status])
}
```

#### `apps/api-gateway/src/controllers/replay.controller.ts`

Fix field references and hardcoded URL:

```typescript
// Line ~75: Remove hardcoded localhost prefix
const targetUrl = originalRequest.url;

// Lines 88-95: Fix field names to match schema
await prisma.replayExecution.update({
  where: { id: execution.id },
  data: {
    responseStatus: response.status,     // Was missing
    responseBody: JSON.stringify(maskedResponse), // Was missing
    completedAt: new Date(),            // Was missing
    status: "COMPLETED",
    endTime: new Date()
  }
});
```

#### `apps/api-gateway/.env`

```env
PORT=3001
REDIS_URL=redis://localhost:6379
JWT_SECRET=galecto-super-secret-key-change-in-production
DATABASE_URL=postgresql://postgres:galecto_secret_2024@localhost:5432/galecto
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=galecto
AUTH_SERVICE_URL=http://localhost:4000
```

### Commands

```bash
# Generate Prisma client after schema changes
cd apps/auth-service
npx prisma generate

# Build and restart API Gateway
cd apps/api-gateway
npm run build
npm run dev
```

---

## 2.3 Fix Auth Service (Day 2 Afternoon)

### Problem
- Hardcoded JWT secret `"secret"`
- Schema migration mismatch (Role enum)

### Files to Modify

#### `apps/auth-service/src/config/env.ts`

Replace with Zod validation:

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("4000"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error);
  process.exit(1);
}

export const env = parsed.data;
```

#### `apps/auth-service/.env`

```env
DATABASE_URL=postgresql://postgres:galecto_secret_2024@localhost:5432/galecto
JWT_SECRET=galecto-super-secret-key-change-in-production
PORT=4000
```

#### `apps/auth-service/prisma/schema.prisma`

Ensure Role enum is correct:

```prisma
enum Role {
  OWNER
  ADMIN
  DEVELOPER
  OBSERVER
}
```

### Commands

```bash
cd apps/auth-service
npx prisma migrate dev --name fix_role_enum
npm run build
npm run dev
```

---

## Verification Checklist

- [ ] Query Service starts without errors
- [ ] Query Service `/health` responds
- [ ] API Gateway starts without Prisma errors
- [ ] Auth Service starts with proper JWT config
- [ ] All services respond to `/health`

## Next Steps
Proceed to [03-alert-rule-system.md](./03-alert-rule-system.md)
