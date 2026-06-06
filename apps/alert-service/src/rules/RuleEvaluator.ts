import { PrismaClient } from "@prisma/client";
import { NotificationPayload } from "../notifiers/NotifierInterface";
import { notificationService } from "../notifiers";

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

  private normalizeEvent(event: Event): Event {
    // Handle SDK format (payload contains nested payload with attributes)
    const payload = event.payload || {};
    const sdkData = payload.payload || payload;
    
    return {
      ...event,
      payload: {
        ...payload,
        statusCode: payload.statusCode || sdkData?.attributes?.status || sdkData?.statusCode || 0,
        durationMs: payload.durationMs || sdkData?.duration || sdkData?.durationMs || 0,
      }
    };
  }

  async evaluateEvent(event: Event): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];
    const normalizedEvent = this.normalizeEvent(event);
    
    try {
      const rules = await this.prisma.alertRule.findMany({
        where: {
          organizationId: normalizedEvent.tenantId,
          enabled: true,
          services: { has: normalizedEvent.service }
        },
        include: { notifications: true }
      });

      for (const rule of rules) {
        const result = this.evaluateRule(rule, normalizedEvent);
        if (result.triggered) {
          results.push(result);
          await this.recordExecution(rule.id, result);
          await this.sendNotifications(rule.notifications, result);
        }
      }
    } catch (error) {
      console.error("Error evaluating events:", error);
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
      console.log(`[AlertService] Recorded execution for rule: ${result.ruleName}`);
    } catch (error) {
      console.error(`[AlertService] Failed to record execution for rule ${ruleId}:`, error);
    }
  }

  private async sendNotifications(notifications: any[], result: EvaluationResult): Promise<void> {
    if (!notifications || notifications.length === 0) {
      console.log(`[AlertService] No notification channels configured for rule: ${result.ruleName}`);
      return;
    }

    const payload: NotificationPayload = {
      title: result.ruleName,
      message: result.reason,
      severity: result.severity,
      service: result.eventData?.service || "unknown",
      eventData: result.eventData,
      timestamp: new Date()
    };

    for (const notification of notifications) {
      try {
        console.log(`[AlertService] Sending ${notification.channelType} notification for rule: ${result.ruleName} (Severity: ${result.severity})`);
        await notificationService.sendNotification(notification.channelType, payload);
        console.log(`[AlertService] Successfully sent ${notification.channelType} notification`);
      } catch (error) {
        console.error(`[AlertService] Failed to send ${notification.channelType} notification:`, error);
      }
    }
  }
}