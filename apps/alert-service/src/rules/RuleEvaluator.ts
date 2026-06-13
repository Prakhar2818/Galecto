import { PrismaClient } from "@prisma/client";

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

export interface EvaluationResult {
  triggered: boolean;
  ruleId: string;
  ruleName: string;
  severity: string;
  reason: string;
  eventData: any;
  notifications?: any[];
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

      console.log(`[RuleEvaluator] Found ${rules.length} matching rules for service ${normalizedEvent.service} in org ${normalizedEvent.tenantId}`);

      for (const rule of rules) {
        const result = this.evaluateRule(rule, normalizedEvent);
        if (result.triggered) {
          result.notifications = rule.notifications || [];
          results.push(result);
          await this.recordExecution(rule.id, result);
        }
      }
    } catch (error) {
      console.error("[RuleEvaluator] Error evaluating events:", error);
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
      console.log(`[RuleEvaluator] Recorded execution for rule: ${result.ruleName}`);
    } catch (error) {
      console.error(`[RuleEvaluator] Failed to record execution for rule ${ruleId}:`, error);
    }
  }
}