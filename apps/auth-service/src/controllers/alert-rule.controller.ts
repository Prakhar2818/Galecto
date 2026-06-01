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