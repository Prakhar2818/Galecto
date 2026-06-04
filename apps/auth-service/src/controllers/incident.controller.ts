import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class IncidentController {
  
  async listIncidents(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { status, severity } = req.query as any;

    const where: any = { organizationId };
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const incidents = await prisma.alert.findMany({
      where,
      include: { notes: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return reply.send({ success: true, data: incidents });
  }

  async getIncident(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { incidentId } = req.params as { incidentId: string };

    const incident = await prisma.alert.findFirst({
      where: { id: incidentId, organizationId },
      include: { notes: { orderBy: { createdAt: 'desc' } } }
    });

    if (!incident) {
      return reply.status(404).send({ error: "Incident not found" });
    }

    return reply.send({ success: true, data: incident });
  }

  async acknowledgeIncident(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { incidentId } = req.params as { incidentId: string };
    const { assignedTo, slaDueInHours } = req.body as any;

    const slaDueAt = slaDueInHours ? new Date(Date.now() + slaDueInHours * 60 * 60 * 1000) : null;

    await prisma.alert.updateMany({
      where: { id: incidentId, organizationId },
      data: { 
        status: 'ACKNOWLEDGED',
        assignedTo,
        slaDueAt
      }
    });

    return reply.send({ success: true });
  }

  async addNote(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const { incidentId } = req.params as { incidentId: string };
    const { content } = req.body as { content: string };

    const incident = await prisma.alert.findFirst({
      where: { id: incidentId, organizationId }
    });

    if (!incident) {
      return reply.status(404).send({ error: "Incident not found" });
    }

    const note = await prisma.incidentNote.create({
      data: {
        alertId: incidentId,
        content,
        authorId: userId
      }
    });

    return reply.send({ success: true, data: note });
  }

  async resolveIncident(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { incidentId } = req.params as { incidentId: string };

    await prisma.alert.updateMany({
      where: { id: incidentId, organizationId },
      data: { 
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    return reply.send({ success: true });
  }
}

export class DeployController {
  
  async listDeployMarkers(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { service, environment } = req.query as any;

    const where: any = { organizationId };
    if (service) where.service = service;
    if (environment) where.environment = environment;

    const markers = await prisma.deployMarker.findMany({
      where,
      orderBy: { deployedAt: 'desc' },
      take: 50
    });

    return reply.send({ success: true, data: markers });
  }

  async createDeployMarker(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const { service, version, environment, commitSha } = req.body as any;

    const marker = await prisma.deployMarker.create({
      data: {
        organizationId,
        service,
        version,
        environment,
        commitSha,
        deployedBy: userId
      }
    });

    return reply.send({ success: true, data: marker });
  }
}

export class SloController {
  
  async listSlos(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;

    const slos = await prisma.sloDefinition.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ success: true, data: slos });
  }

  async createSlo(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { name, service, indicatorType, targetPercent, windowDays } = req.body as any;

    const slo = await prisma.sloDefinition.create({
      data: {
        organizationId,
        name,
        service,
        indicatorType,
        targetPercent,
        windowDays: windowDays || 7
      }
    });

    return reply.send({ success: true, data: slo });
  }

  async deleteSlo(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { sloId } = req.params as { sloId: string };

    await prisma.sloDefinition.deleteMany({
      where: { id: sloId, organizationId }
    });

    return reply.send({ success: true });
  }

  async listSloTargets(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;

    const targets = await prisma.sloTarget.findMany({
      where: { organizationId },
      orderBy: { serviceName: 'asc' }
    });

    return reply.send({ success: true, data: targets });
  }

  async upsertSloTarget(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { service, errorRateThreshold, latencyThreshold } = req.body as any;

    if (!service) {
      return reply.status(400).send({ success: false, error: 'Service name is required' });
    }

    const target = await prisma.sloTarget.upsert({
      where: {
        organizationId_serviceName: {
          organizationId,
          serviceName: service
        }
      },
      update: {
        errorRateThreshold: errorRateThreshold ?? 1.0,
        latencyThreshold: latencyThreshold ?? 500
      },
      create: {
        organizationId,
        serviceName: service,
        errorRateThreshold: errorRateThreshold ?? 1.0,
        latencyThreshold: latencyThreshold ?? 500
      }
    });

    return reply.send({ success: true, data: target });
  }

  async deleteSloTarget(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { serviceName } = req.params as { serviceName: string };

    await prisma.sloTarget.deleteMany({
      where: { organizationId, serviceName }
    });

    return reply.send({ success: true });
  }
}