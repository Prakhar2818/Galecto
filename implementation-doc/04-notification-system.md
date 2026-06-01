# Phase 4: Notification System (Day 5-6)

## Objective
Build notification delivery to Slack, Microsoft Teams, and Email.

---

## 4.1 Notification Channel API (Day 5 Morning)

### Files to Create

#### `apps/auth-service/src/routes/notifications.routes.ts`

```typescript
import { FastifyInstance } from "fastify";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);

  fastify.get("/", async (request, reply) => notificationController.list(request, reply));
  fastify.post("/", async (request, reply) => notificationController.create(request, reply));
  fastify.get("/:id", async (request, reply) => notificationController.get(request, reply));
  fastify.put("/:id", async (request, reply) => notificationController.update(request, reply));
  fastify.delete("/:id", async (request, reply) => notificationController.delete(request, reply));
  fastify.post("/:id/test", async (request, reply) => notificationController.test(request, reply));
}
```

#### `apps/auth-service/src/controllers/notification.controller.ts`

```typescript
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface NotificationChannelRequest {
  type: "EMAIL" | "SLACK" | "TEAMS" | "WEBHOOK";
  name: string;
  config: {
    webhook_url?: string;
    channel?: string;
    recipients?: string[];
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
  };
  enabled?: boolean;
}

export const notificationController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const channels = await prisma.notificationChannel.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return reply.send({ success: true, data: channels });
  },

  async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    const channel = await prisma.notificationChannel.findFirst({ where: { id, organizationId } });
    if (!channel) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Channel not found" } });
    }
    return reply.send({ success: true, data: channel });
  },

  async create(request: FastifyRequest<{ Body: NotificationChannelRequest }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const body = request.body;
    const channel = await prisma.notificationChannel.create({
      data: {
        type: body.type,
        name: body.name,
        config: body.config as any,
        enabled: body.enabled !== false,
        organizationId
      }
    });
    return reply.status(201).send({ success: true, data: channel });
  },

  async update(request: FastifyRequest<{ Params: { id: string }, Body: NotificationChannelRequest }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    const body = request.body;
    const channel = await prisma.notificationChannel.update({
      where: { id, organizationId },
      data: {
        type: body.type,
        name: body.name,
        config: body.config as any,
        enabled: body.enabled !== false
      }
    });
    return reply.send({ success: true, data: channel });
  },

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    await prisma.notificationChannel.delete({ where: { id, organizationId } });
    return reply.send({ success: true });
  },

  async test(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params;
    const channel = await prisma.notificationChannel.findFirst({ where: { id, organizationId } });
    if (!channel) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Channel not found" } });
    }
    return reply.send({
      success: true,
      message: "Test notification sent via " + channel.type,
      data: { channelId: id, type: channel.type }
    });
  }
};
```

#### Register routes in `apps/auth-service/src/app.ts`

```typescript
import { notificationRoutes } from "./routes/notifications.routes";

// Add:
app.register(notificationRoutes, { prefix: "/api/v1/notifications" });
```

---

## 4.2 Notifiers (Day 5 Afternoon - Day 6)

### Files to Create

#### `apps/alert-service/src/notifiers/NotifierInterface.ts`

```typescript
export interface NotificationPayload {
  title: string;
  message: string;
  severity: string;
  service: string;
  eventData?: any;
  timestamp: Date;
}

export interface Notifier {
  send(payload: NotificationPayload): Promise<void>;
  test(channelConfig: any): Promise<boolean>;
}

export abstract class BaseNotifier implements Notifier {
  abstract send(payload: NotificationPayload): Promise<void>;
  abstract test(channelConfig: any): Promise<boolean>;

  protected formatMessage(payload: NotificationPayload): string {
    return `
🚨 *${payload.title}*

*Severity:* ${payload.severity}
*Service:* ${payload.service}
*Time:* ${payload.timestamp.toISOString()}

${payload.message}

${payload.eventData ? `\`\`\`\n${JSON.stringify(payload.eventData, null, 2)}\n\`\`\`` : ''}
    `.trim();
  }
}
```

#### `apps/alert-service/src/notifiers/SlackNotifier.ts`

```typescript
import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import { logger } from "@galecto/logger";
import axios from "axios";

export class SlackNotifier extends BaseNotifier {
  async send(payload: NotificationPayload): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      logger.warn("Slack webhook URL not configured");
      return;
    }

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 ${payload.title}`,
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Severity:*\n${payload.severity}` },
          { type: "mrkdwn", text: `*Service:*\n${payload.service}` },
          { type: "mrkdwn", text: `*Time:*\n${payload.timestamp.toISOString()}` }
        ]
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: payload.message }
      }
    ];

    if (payload.eventData) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`\`\`${JSON.stringify(payload.eventData, null, 2)}\`\`\``
        }
      });
    }

    try {
      await axios.post(webhookUrl, {
        blocks,
        text: `${payload.severity}: ${payload.title} - ${payload.service}`
      }, {
        headers: { "Content-Type": "application/json" }
      });
      logger.info({ service: payload.service }, "Slack notification sent");
    } catch (error) {
      logger.error({ error, service: payload.service }, "Failed to send Slack notification");
      throw error;
    }
  }

  async test(channelConfig: { webhook_url: string }): Promise<boolean> {
    try {
      await axios.post(channelConfig.webhook_url, {
        text: "✅ Galecto Alert System Test - Slack integration is working!"
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

#### `apps/alert-service/src/notifiers/TeamsNotifier.ts`

```typescript
import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import { logger } from "@galecto/logger";
import axios from "axios";

export class TeamsNotifier extends BaseNotifier {
  async send(payload: NotificationPayload): Promise<void> {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      logger.warn("Teams webhook URL not configured");
      return;
    }

    const card = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: this.getSeverityColor(payload.severity),
      summary: payload.title,
      sections: [{
        activityTitle: payload.title,
        activitySubtitle: payload.service,
        facts: [
          { name: "Severity", value: payload.severity },
          { name: "Time", value: payload.timestamp.toISOString() },
          { name: "Message", value: payload.message }
        ],
        text: payload.eventData ? JSON.stringify(payload.eventData, null, 2) : undefined
      }]
    };

    try {
      await axios.post(webhookUrl, card, {
        headers: { "Content-Type": "application/json" }
      });
      logger.info({ service: payload.service }, "Teams notification sent");
    } catch (error) {
      logger.error({ error, service: payload.service }, "Failed to send Teams notification");
      throw error;
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "FF0000";
      case "HIGH": return "FFA500";
      case "MEDIUM": return "FFFF00";
      case "LOW": return "00FF00";
      default: return "808080";
    }
  }

  async test(channelConfig: { webhook_url: string }): Promise<boolean> {
    try {
      await axios.post(channelConfig.webhook_url, {
        text: "✅ Galecto Alert System Test - Microsoft Teams integration is working!"
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

#### `apps/alert-service/src/notifiers/EmailNotifier.ts`

```typescript
import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import { logger } from "@galecto/logger";
import nodemailer from "nodemailer";

export class EmailNotifier extends BaseNotifier {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async send(payload: NotificationPayload): Promise<void> {
    const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(",") || [];
    if (recipients.length === 0) {
      logger.warn("No email recipients configured");
      return;
    }

    const html = `
      <h2 style="color: ${this.getSeverityColor(payload.severity)}">${payload.title}</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Severity</td><td style="padding: 8px; border: 1px solid #ddd;">${payload.severity}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Service</td><td style="padding: 8px; border: 1px solid #ddd;">${payload.service}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time</td><td style="padding: 8px; border: 1px solid #ddd;">${payload.timestamp.toISOString()}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Message</td><td style="padding: 8px; border: 1px solid #ddd;">${payload.message}</td></tr>
      </table>
      ${payload.eventData ? `<pre>${JSON.stringify(payload.eventData, null, 2)}</pre>` : ''}
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "alerts@galecto.io",
        to: recipients.join(", "),
        subject: `[${payload.severity}] ${payload.title} - ${payload.service}`,
        html
      });
      logger.info({ service: payload.service, recipients }, "Email notification sent");
    } catch (error) {
      logger.error({ error, service: payload.service }, "Failed to send email notification");
      throw error;
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "red";
      case "HIGH": return "orange";
      case "MEDIUM": return "yellow";
      case "LOW": return "green";
      default: return "gray";
    }
  }

  async test(channelConfig: any): Promise<boolean> {
    return true;
  }
}
```

#### `apps/alert-service/src/notifiers/index.ts`

```typescript
import { Notifier, NotificationPayload } from "./NotifierInterface";
import { SlackNotifier } from "./SlackNotifier";
import { TeamsNotifier } from "./TeamsNotifier";
import { EmailNotifier } from "./EmailNotifier";
import { logger } from "@galecto/logger";

export class NotificationService {
  private notifiers: Map<string, Notifier> = new Map();

  constructor() {
    this.notifiers.set("SLACK", new SlackNotifier());
    this.notifiers.set("TEAMS", new TeamsNotifier());
    this.notifiers.set("EMAIL", new EmailNotifier());
  }

  async sendNotification(channelType: string, payload: NotificationPayload): Promise<void> {
    const notifier = this.notifiers.get(channelType);
    if (!notifier) {
      logger.warn({ channelType }, "Unsupported notification channel type");
      return;
    }
    await notifier.send(payload);
  }

  async sendToAllChannels(channels: { type: string; config: any }[], payload: NotificationPayload): Promise<void> {
    const promises = channels.map(channel =>
      this.sendNotification(channel.type, payload).catch(error => {
        logger.error({ error, channelType: channel.type }, "Failed to send to channel");
      })
    );
    await Promise.all(promises);
  }

  async testChannel(channelType: string, config: any): Promise<boolean> {
    const notifier = this.notifiers.get(channelType);
    if (!notifier) return false;
    return notifier.test(config);
  }
}

export const notificationService = new NotificationService();
```

### Add dependency to `apps/alert-service/package.json`

```json
"nodemailer": "^7.0.12"
```

### Commands

```bash
cd apps/alert-service
npm install nodemailer axios
npm run build
```

---

## Verification Checklist

- [ ] Notification channels can be created via API
- [ ] Notification channels can be listed
- [ ] Slack notifier sends message successfully
- [ ] Teams notifier sends card successfully
- [ ] Email notifier sends email successfully
- [ ] Alert evaluation triggers notifications

## Next Steps
Proceed to [05-frontend-dashboard.md](./05-frontend-dashboard.md)
