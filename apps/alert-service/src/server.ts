import "dotenv/config";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { PrismaClient, AlertStatus, AlertSeverity } from "@prisma/client";
import { createConsumer } from "../../../packages/kafka/src/consumer";
import { IEvent } from "../../../packages/api-types/src/index";
import { notificationService } from "./notifiers";
import { NotificationPayload } from "./notifiers/NotifierInterface";
import { RuleEvaluator } from "./rules/RuleEvaluator";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const publicPaths = ['/api/v1/send-test-notifications', '/health'];
  if (publicPaths.some(path => request.url.startsWith(path))) {
    return;
  }
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

async function start() {
  try {
    await app.register(cors, { origin: "*" });
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || "secret",
    });

    app.post("/api/v1/send-test-notifications", { preHandler: [] }, async (req, reply) => {
      console.log(`[AlertService] Received request to send test notifications`);

      const notificationPayload: NotificationPayload = {
        title: `🚨 TEST NOTIFICATION: Direct Test`,
        message: "This is a direct test of the notification system - checking if Slack and Email are working!",
        severity: "HIGH",
        service: "test-service",
        eventData: {
          test: true,
          timestamp: Date.now(),
          source: "direct-api-call"
        },
        timestamp: new Date()
      };

      const results: any = {};

      try {
        await notificationService.sendNotification("SLACK", notificationPayload);
        results.slack = "sent";
        console.log(`[AlertService] SLACK notification sent`);
      } catch (error) {
        results.slack = `failed: ${error}`;
        console.error(`[AlertService] SLACK notification failed:`, error);
      }

      try {
        await notificationService.sendNotification("EMAIL", notificationPayload);
        results.email = "sent";
        console.log(`[AlertService] EMAIL notification sent`);
      } catch (error) {
        results.email = `failed: ${error}`;
        console.error(`[AlertService] EMAIL notification failed:`, error);
      }

      return {
        success: true,
        data: {
          message: "Test notifications sent",
          results
        }
      };
    });

    const ruleEvaluator = new RuleEvaluator(prisma);

    await createConsumer("alert-service-group", "events", async (event: IEvent) => {
      console.log(`[AlertService] Received event: name=${event.name}, type=${event.type}, service=${event.service}, tenantId=${event.tenantId}`);

      if (!event.tenantId || event.tenantId === "anonymous") {
        console.log(`[AlertService] Skipping event: no valid tenantId`);
        return;
      }

      let statusCode = 0;
      let durationMs = 0;

      // Handle SDK trace format (http-request with attributes.status)
      if (event.name === "INGEST_LOG" && event.payload?.event === "TRACE") {
        const traceData = event.payload?.payload || event.payload;
        statusCode = traceData?.attributes?.status || traceData?.statusCode || 0;
        durationMs = traceData?.duration || traceData?.durationMs || 0;
        console.log(`[AlertService] SDK TRACE format: statusCode=${statusCode}, durationMs=${durationMs}`);
      }
      // Handle direct trace format (api-gateway response logging)
      else if (event.name.includes("RESPONSE") || event.name.includes("TRACE")) {
        statusCode = event.payload?.statusCode || event.payload?.status || 0;
        durationMs = event.payload?.durationMs || event.payload?.duration || 0;
        console.log(`[AlertService] Gateway RESPONSE/TRACE format: statusCode=${statusCode}, durationMs=${durationMs}`);
      }
      // Handle OTLP trace format (EventType.TRACE from otlp.controller)
      // Only process RESPONSE/span traces, not REQUEST events (which have no status yet)
      else if (event.type === "TRACE" && !event.name.includes("REQUEST")) {
        const attrs = event.payload?.attributes || {};
        // OTLP spans often carry the real HTTP status code in attributes, not the span status
        statusCode = attrs['http.status_code'] || attrs['http.response.status_code'] || event.payload?.statusCode || 0;
        durationMs = event.payload?.durationMs || event.payload?.duration || 0;
        console.log(`[AlertService] OTLP TRACE format: statusCode=${statusCode}, durationMs=${durationMs}, attributes=${JSON.stringify(attrs)}`);
      }
      else {
        console.log(`[AlertService] Event format not recognized for alerting: name=${event.name}, type=${event.type}`);
      }

      // Extract endpoint/URL
      const endpoint = event.payload?.url || event.payload?.path || event.payload?.endpoint || 
                 event.payload?.attributes?.['http.url'] || event.payload?.attributes?.['http.path'] || 
                 event.payload?.attributes?.['http.route'] || event.payload?.route || '';

      // Extract actual error message from various payload shapes
      let actualErrorMessage = '';
      if (statusCode >= 400) {
        actualErrorMessage = event.payload?.statusMessage || 
                             event.payload?.message || 
                             event.payload?.error || 
                             event.payload?.errorMessage || 
                             event.payload?.body?.stringValue || 
                             event.payload?.body?.message || 
                             event.payload?.responseBody?.message || 
                             event.payload?.responseBody?.error || 
                             event.payload?.attributes?.['http.status_text'] || 
                             '';
        
        if (!actualErrorMessage && event.payload?.body) {
          try {
            const bodyStr = typeof event.payload.body === 'string' ? event.payload.body : JSON.stringify(event.payload.body);
            const parsedBody = JSON.parse(bodyStr);
            actualErrorMessage = parsedBody.message || parsedBody.error || parsedBody.detail || '';
          } catch {
            // body is not JSON, keep empty
          }
        }
      }

      // Build fallback reason for hardcoded threshold logic
      let fallbackReason = '';
      let fallbackErrorType = statusCode >= 400 ? 'ERROR' : 'LATENCY';
      let fallbackTriggered = false;

      if (statusCode >= 400) {
        fallbackTriggered = true;
        if (actualErrorMessage) {
          fallbackReason = `${event.service} ${statusCode}: ${actualErrorMessage}`;
        } else {
          fallbackReason = `${event.service} returned HTTP ${statusCode}`;
        }
        if (endpoint) {
          fallbackReason += ` (${endpoint})`;
        }
      }

      if (durationMs > 500) {
        fallbackTriggered = true;
        fallbackErrorType = 'LATENCY';
        const latencyReason = `Latency spike: ${event.service} took ${durationMs}ms`;
        if (endpoint) {
          fallbackReason = fallbackReason ? `${fallbackReason} | ${latencyReason} (${endpoint})` : `${latencyReason} (${endpoint})`;
        } else {
          fallbackReason = fallbackReason ? `${fallbackReason} | ${latencyReason}` : latencyReason;
        }
      }

      // Evaluate database alert rules
      let ruleTriggered = false;
      try {
        const ruleResults = await ruleEvaluator.evaluateEvent({
          name: event.name,
          service: event.service,
          tenantId: event.tenantId,
          payload: { statusCode, durationMs, ...event.payload },
          timestamp: event.timestamp
        });

        if (ruleResults.length > 0) {
          ruleTriggered = true;
          console.log(`[AlertService] ${ruleResults.length} alert rule(s) triggered for event`);

          for (const result of ruleResults) {
            const channelIds = result.notifications?.map((n: any) => n.channelId) || [];
            await createAlertAndNotify(
              event,
              result.ruleName,
              result.reason,
              result.severity,
              'RULE',
              statusCode,
              channelIds
            );
          }
        } else {
          console.log(`[AlertService] No alert rules triggered for event`);
        }
      } catch (err) {
        console.error(`[AlertService] Rule evaluation failed:`, err);
      }

      // Fallback: if no rules triggered and hardcoded thresholds are met, create a generic alert
      if (!ruleTriggered && fallbackTriggered) {
        console.log(`[AlertService] Fallback alert triggered: ${fallbackReason}`);
        await createAlertAndNotify(
          event,
          `Alert: ${event.service}`,
          fallbackReason,
          statusCode >= 500 ? "CRITICAL" : statusCode >= 400 ? "HIGH" : "MEDIUM",
          fallbackErrorType,
          statusCode,
          []
        );
      } else {
        console.log(`[AlertService] Evaluated event: ruleTriggered=${ruleTriggered}, fallbackTriggered=${fallbackTriggered}, no alert created`);
      }
    });

    async function createAlertAndNotify(
      event: IEvent,
      title: string,
      message: string,
      severity: string,
      errorType: string,
      statusCode: number,
      channelIds: string[] = []
    ) {
      try {
        const alert = await prisma.alert.create({
          data: {
            traceId: event.traceId,
            service: event.service,
            type: errorType,
            message,
            status: AlertStatus.ACTIVE,
            severity: severity === "CRITICAL" ? AlertSeverity.CRITICAL : severity === "HIGH" ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
            organizationId: event.tenantId,
          }
        });
        app.log.warn({ alertId: alert.id }, "ALERT TRIGGERED AND PERSISTED");

        let channels: any[];
        if (channelIds.length > 0) {
          channels = await prisma.notificationChannel.findMany({
            where: { id: { in: channelIds }, organizationId: event.tenantId, enabled: true }
          });
          console.log(`[AlertService] Found ${channels.length} of ${channelIds.length} requested notification channels for rule alert`);
        } else {
          channels = await prisma.notificationChannel.findMany({
            where: { organizationId: event.tenantId, enabled: true }
          });
          console.log(`[AlertService] Found ${channels.length} enabled notification channels for fallback alert`);
        }

        // Get all organization users for email notifications
        const users = await prisma.user.findMany({
          where: { organizationId: event.tenantId },
          select: { email: true }
        });
        const userEmails = users.map(u => u.email);
        console.log(`[AlertService] Found ${userEmails.length} organization users for email notifications`);

        if (channels.length > 0) {
          const notificationPayload: NotificationPayload = {
            title,
            message,
            severity,
            service: event.service,
            eventData: event.payload,
            timestamp: new Date(),
            userEmails
          };

          for (const channel of channels) {
            try {
              console.log(`[AlertService] Sending ${channel.type} notification via channel ${channel.id} (${channel.name}) for alert ${alert.id}`);
              await notificationService.sendNotification(channel.type, notificationPayload, channel.config);
              console.log(`[AlertService] Sent ${channel.type} notification for alert ${alert.id}`);
            } catch (notifError) {
              console.error(`[AlertService] Failed to send ${channel.type} notification:`, notifError);
            }
          }
        } else {
          console.log(`[AlertService] No notification channels configured for org ${event.tenantId}, skipping notifications`);
        }
      } catch (err) {
        app.log.error({ err, tenantId: event.tenantId }, "Failed to persist alert");
      }
    }

    app.addHook("onRequest", jwtAuthMiddleware);

    app.get("/api/v1/alerts", async (request) => {
      const user = request.user as any;
      const orgId = user?.organizationId;
      
      const alerts = await prisma.alert.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      
      return { success: true, data: alerts };
    });

    app.post("/api/v1/alerts/:id/resolve", async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = request.user as any;
      const orgId = user?.organizationId;
      
      await prisma.alert.updateMany({
        where: { id, organizationId: orgId },
        data: { 
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date()
        }
      });
      
      return { success: true };
    });

    app.post("/api/v1/test-notification", async (request, reply) => {
      const user = request.user as any;
      const orgId = user?.organizationId;
      
      const channels = await prisma.notificationChannel.findMany({
        where: { organizationId: orgId, enabled: true }
      });

      const testPayload: NotificationPayload = {
        title: "Test Alert from Galecto",
        message: "This is a test notification to verify all channels are working.",
        severity: "HIGH",
        service: "test-service",
        eventData: { test: true, timestamp: Date.now() },
        timestamp: new Date()
      };

      const results = [];
      for (const channel of channels) {
        try {
          await notificationService.sendNotification(channel.type, testPayload, channel.config);
          results.push({ channelId: channel.id, type: channel.type, status: "sent" });
        } catch (error) {
          results.push({ channelId: channel.id, type: channel.type, status: "failed", error: String(error) });
        }
      }

      return { success: true, data: { testedChannels: results.length, results } };
    });

    app.post("/api/v1/test-channel/:channelId", async (request, reply) => {
      const user = request.user as any;
      const orgId = user?.organizationId;
      const { channelId } = request.params as { channelId: string };
      
      const channel = await prisma.notificationChannel.findFirst({
        where: { id: channelId, organizationId: orgId, enabled: true }
      });

      if (!channel) {
        return reply.status(404).send({ success: false, error: "Channel not found" });
      }

      const testPayload: NotificationPayload = {
        title: "Test Alert from Galecto",
        message: "This is a test notification to verify this channel is working.",
        severity: "HIGH",
        service: "test-service",
        eventData: { test: true, timestamp: Date.now() },
        timestamp: new Date()
      };

      try {
        await notificationService.sendNotification(channel.type, testPayload, channel.config);
        console.log(`[AlertService] Test notification sent to ${channel.type} channel ${channel.id}`);
        return { success: true, message: `Test notification sent to ${channel.name} (${channel.type})` };
      } catch (error) {
        console.error(`[AlertService] Failed to send test notification to ${channel.type} channel ${channel.id}:`, error);
        return reply.status(500).send({ success: false, error: `Failed to send test notification: ${error}` });
      }
    });

    app.post("/api/v1/trigger-test-alert", async (request, reply) => {
      const user = request.user as any;
      const orgId = user?.organizationId || "test-org-123";
      
      const testAlert = await prisma.alert.create({
        data: {
          traceId: `test-trace-${Date.now()}`,
          service: "api-gateway",
          type: "ERROR",
          message: "Test Error: This is a simulated 500 error for testing notifications",
          status: AlertStatus.ACTIVE,
          severity: AlertSeverity.HIGH,
          organizationId: orgId,
        }
      });

      console.log(`[AlertService] Created test alert: ${testAlert.id}`);

      const notificationPayload: NotificationPayload = {
        title: `🚨 TEST ALERT: api-gateway`,
        message: "Test Error: This is a simulated 500 error for testing notifications",
        severity: "HIGH",
        service: "api-gateway",
        eventData: {
          statusCode: 500,
          durationMs: 1245,
          traceId: testAlert.traceId,
          test: true
        },
        timestamp: new Date()
      };

      // Get all organization users for email notifications
      const users = await prisma.user.findMany({
        where: { organizationId: orgId },
        select: { email: true }
      });
      const userEmails = users.map(u => u.email);
      const notificationPayloadWithUsers: NotificationPayload = {
        ...notificationPayload,
        userEmails
      };

      // Get Slack channel config
      const slackChannel = await prisma.notificationChannel.findFirst({
        where: { organizationId: orgId, type: 'SLACK', enabled: true }
      });
      await notificationService.sendNotification("SLACK", notificationPayloadWithUsers, slackChannel?.config);
      console.log(`[AlertService] Sent SLACK notification for test alert`);
      
      // Get Email channel config
      const emailChannel = await prisma.notificationChannel.findFirst({
        where: { organizationId: orgId, type: 'EMAIL', enabled: true }
      });
      await notificationService.sendNotification("EMAIL", notificationPayloadWithUsers, emailChannel?.config);
      console.log(`[AlertService] Sent EMAIL notification for test alert`);

      return { 
        success: true, 
        data: { 
          alertId: testAlert.id,
          message: "Test alert triggered and notifications sent"
        } 
      };
    });

    const port = Number(process.env.PORT) || 5003;
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Alert service listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
