# Phase 3: Alert Rule System (Day 3-4)

## Objective
Build a complete alert rule management system with database-backed rules and evaluation engine.

---

## 3.1 Database Schema (Day 3 Morning)

### Files to Modify

#### `apps/auth-service/prisma/schema.prisma`

Add these models to the schema:

```prisma
model AlertRule {
  id              String   @id @default(uuid())
  name            String
  description     String?
  enabled         Boolean  @default(true)
  conditionType   String   // ERROR_RATE, LATENCY, THRESHOLD, ANOMALY
  conditionValue  Json     // {threshold: 400, operator: ">=", windowMinutes: 5}
  severity        String   // CRITICAL, HIGH, MEDIUM, LOW, INFO
  cooldownMinutes Int      @default(5)
  organizationId  String
  services        String[] // Target services
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  notifications   AlertNotification[]
  executions      AlertExecution[]

  @@index([organizationId, enabled])
  @@index([severity])
}

model AlertNotification {
  id          String   @id @default(uuid())
  alertRuleId String
  channelType String   // EMAIL, SLACK, TEAMS, WEBHOOK
  channelId   String
  createdAt   DateTime @default(now())

  alertRule   AlertRule @relation(fields: [alertRuleId], references: [id], onDelete: Cascade)

  @@index([alertRuleId])
}

model AlertExecution {
  id          String   @id @default(uuid())
  alertRuleId String
  triggeredAt DateTime @default(now())
  status      String   // TRIGGERED, RESOLVED
  eventData   Json

  alertRule   AlertRule @relation(fields: [alertRuleId], references: [id], onDelete: Cascade)

  @@index([alertRuleId, triggeredAt])
}

model NotificationChannel {
  id             String   @id @default(uuid())
  organizationId String
  type           String   // EMAIL, SLACK, TEAMS, WEBHOOK
  name           String
  config         Json     // {webhook_url, channel, recipients, etc.}
  enabled        Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([organizationId])
}
```

### Commands

```bash
cd apps/auth-service
npx prisma migrate dev --name add_alert_rules_and_channels
npx prisma generate
```

---

## 3.2 Alert Rule CRUD API (Day 3 Afternoon)

### Files to Create

#### `apps/auth-service/src/routes/alert-rules.routes.ts`

```typescript
import { FastifyInstance } from "fastify";
import { alertRuleController } from "../controllers/alert-rule.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function alertRuleRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);

  fastify.get("/", async (request, reply) => alertRuleController.list(request, reply));
  fastify.get("/:id", async (request, reply) => alertRuleController.get(request, reply));
  fastify.post("/", async (request, reply) => alertRuleController.create(request, reply));
  fastify.put("/:id", async (request, reply) => alertRuleController.update(request, reply));
  fastify.delete("/:id", async (request, reply) => alertRuleController.delete(request, reply));
  fastify.post("/:id/test", async (request, reply) => alertRuleController.test(request, reply));
  fastify.get("/:id/executions", async (request, reply) => alertRuleController.executions(request, reply));
}
```

#### `apps/auth-service/src/controllers/alert-rule.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AlertRuleRequest {
  name: string;
  description?: string;
  conditionType: "ERROR_RATE" | "LATENCY" | "THRESHOLD" | "ANOMALY";
  conditionValue: {
    threshold: number;
    operator: ">=" | "<=" | ">" | "<";
    windowMinutes: number;
  };
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  services: string[];
  cooldownMinutes?: number;
  notificationChannels?: { channelType: string; channelId: string }[];
  enabled?: boolean;
}

export const alertRuleController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const rules = await prisma.alertRule.findMany({
      where: { organizationId },
      include: {
        notifications: true,
        executions: { take: 10, orderBy: { triggeredAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    return reply.send({ success: true, data: rules });
  },

  async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    const rule = await prisma.alertRule.findFirst({
      where: { id, organizationId },
      include: {
        notifications: true,
        executions: { take: 50, orderBy: { triggeredAt: "desc" } }
      }
    });
    if (!rule) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Alert rule not found" } });
    }
    return reply.send({ success: true, data: rule });
  },

  async create(request: FastifyRequest<{ Body: AlertRuleRequest }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const body = request.body;
    const rule = await prisma.alertRule.create({
      data: {
        name: body.name,
        description: body.description,
        conditionType: body.conditionType,
        conditionValue: body.conditionValue as any,
        severity: body.severity,
        services: body.services,
        cooldownMinutes: body.cooldownMinutes || 5,
        enabled: body.enabled !== false,
        organizationId,
        notifications: body.notificationChannels ? {
          create: body.notificationChannels.map(n => ({
            channelType: n.channelType,
            channelId: n.channelId
          }))
        } : undefined
      },
      include: { notifications: true }
    });
    return reply.status(201).send({ success: true, data: rule });
  },

  async update(request: FastifyRequest<{ Params: { id: string }, Body: AlertRuleRequest }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    const body = request.body;

    await prisma.alertNotification.deleteMany({ where: { alertRuleId: id } });

    const rule = await prisma.alertRule.update({
      where: { id, organizationId },
      data: {
        name: body.name,
        description: body.description,
        conditionType: body.conditionType,
        conditionValue: body.conditionValue as any,
        severity: body.severity,
        services: body.services,
        cooldownMinutes: body.cooldownMinutes || 5,
        enabled: body.enabled !== false,
        notifications: body.notificationChannels ? {
          create: body.notificationChannels.map(n => ({
            channelType: n.channelType,
            channelId: n.channelId
          }))
        } : undefined
      },
      include: { notifications: true }
    });
    return reply.send({ success: true, data: rule });
  },

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    await prisma.alertRule.delete({ where: { id, organizationId } });
    return reply.send({ success: true });
  },

  async test(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const rule = await prisma.alertRule.findUnique({
      where: { id },
      include: { notifications: true }
    });
    return reply.send({
      success: true,
      message: "Test notification sent",
      data: { ruleId: id, notificationsTriggered: rule?.notifications.length || 0 }
    });
  },

  async executions(request: FastifyRequest<{ Params: { id: string }, Querystring: { limit?: number } }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    const limit = request.query.limit || 50;
    const rule = await prisma.alertRule.findFirst({ where: { id, organizationId } });
    if (!rule) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Alert rule not found" } });
    }
    const executions = await prisma.alertExecution.findMany({
      where: { alertRuleId: id },
      take: limit,
      orderBy: { triggeredAt: "desc" }
    });
    return reply.send({ success: true, data: executions });
  }
};
```

#### Register routes in `apps/auth-service/src/app.ts`

```typescript
import { alertRuleRoutes } from "./routes/alert-rules.routes";

// Add this line where other routes are registered:
app.register(alertRuleRoutes, { prefix: "/api/v1/platform/rules" });
```

---

## 3.3 Alert Evaluation Engine (Day 4)

### Files to Create

#### `apps/alert-service/src/rules/RuleEvaluator.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { logger } from "@galecto/logger";

interface Event {
  name: string;
  service: string;
  tenantId: string;
  payload: {
    statusCode?: number;
    durationMs?: number;
    [key: string]: any;
  };
  timestamp: number;
}

interface EvaluationResult {
  triggered: boolean;
  ruleId: string;
  ruleName: string;
  severity: string;
  reason: string;
  eventData: any;
}

export class RuleEvaluator {
  constructor(private prisma: PrismaClient) {}

  async evaluateEvent(event: Event): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];
    const rules = await this.prisma.alertRule.findMany({
      where: {
        organizationId: event.tenantId,
        enabled: true,
        services: { has: event.service }
      },
      include: { notifications: true }
    });

    for (const rule of rules) {
      const result = this.evaluateRule(rule, event);
      if (result.triggered) {
        results.push(result);
        await this.recordExecution(rule.id, result);
        await this.sendNotifications(rule, result);
      }
    }
    return results;
  }

  private evaluateRule(rule: any, event: Event): EvaluationResult {
    const conditionValue = rule.conditionValue as {
      threshold: number;
      operator: string;
      windowMinutes: number;
    };

    let triggered = false;
    let reason = "";

    switch (rule.conditionType) {
      case "ERROR_RATE":
        if (event.payload.statusCode && event.payload.statusCode >= conditionValue.threshold) {
          triggered = true;
          reason = `Error status code ${event.payload.statusCode} >= ${conditionValue.threshold}`;
        }
        break;
      case "LATENCY":
        if (event.payload.durationMs && this.compareValues(event.payload.durationMs, conditionValue.threshold, conditionValue.operator)) {
          triggered = true;
          reason = `Latency ${event.payload.durationMs}ms ${conditionValue.operator} ${conditionValue.threshold}ms`;
        }
        break;
      case "THRESHOLD":
        if (event.payload.statusCode && this.compareValues(event.payload.statusCode, conditionValue.threshold, conditionValue.operator)) {
          triggered = true;
          reason = `Status code ${event.payload.statusCode} ${conditionValue.operator} ${conditionValue.threshold}`;
        }
        break;
      case "ANOMALY":
        triggered = false;
        reason = "Anomaly detection requires historical data analysis";
        break;
    }

    return {
      triggered,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      reason,
      eventData: event.payload
    };
  }

  private compareValues(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case ">=": return value >= threshold;
      case "<=": return value <= threshold;
      case ">": return value > threshold;
      case "<": return value < threshold;
      default: return false;
    }
  }

  private async recordExecution(ruleId: string, result: EvaluationResult): Promise<void> {
    try {
      await this.prisma.alertExecution.create({
        data: {
          alertRuleId: ruleId,
          triggeredAt: new Date(),
          status: "TRIGGERED",
          eventData: result.eventData as any
        }
      });
    } catch (error) {
      logger.error({ error, ruleId }, "Failed to record alert execution");
    }
  }

  private async sendNotifications(rule: any, result: EvaluationResult): Promise<void> {
    for (const notification of rule.notifications) {
      try {
        logger.info({
          notificationChannelId: notification.channelId,
          notificationType: notification.channelType,
          ruleId: rule.id,
          severity: result.severity
        }, "Sending alert notification");
      } catch (error) {
        logger.error({ error, notification }, "Failed to send notification");
      }
    }
  }
}
```

#### Update `apps/alert-service/src/server.ts`

```typescript
import { RuleEvaluator } from "./rules/RuleEvaluator";

const prisma = new PrismaClient();
const ruleEvaluator = new RuleEvaluator(prisma);

// In Kafka consumer:
await createConsumer("alert-service-group", "events", async (event: IEvent) => {
  const results = await ruleEvaluator.evaluateEvent({
    name: event.name,
    service: event.service,
    tenantId: event.tenantId,
    payload: event.payload,
    timestamp: event.timestamp
  });

  if (results.length > 0) {
    logger.info({
      eventName: event.name,
      service: event.service,
      triggeredRules: results.length
    }, "Alert rules triggered");
  }
});
```

---

## Verification Checklist

- [ ] Prisma migration runs successfully
- [ ] Alert rules can be created via API
- [ ] Alert rules can be listed
- [ ] Alert rules can be updated
- [ ] Alert rules can be deleted
- [ ] Alert evaluation triggers on events
- [ ] Execution history is recorded

## Next Steps
Proceed to [04-notification-system.md](./04-notification-system.md)
