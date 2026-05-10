"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SloController = exports.DeployController = exports.IncidentController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class IncidentController {
    async listIncidents(req, reply) {
        const organizationId = req.user.organizationId;
        const { status, severity } = req.query;
        const where = { organizationId };
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        const incidents = await prisma.alert.findMany({
            where,
            include: { notes: { orderBy: { createdAt: 'desc' } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return reply.send({ success: true, data: incidents });
    }
    async getIncident(req, reply) {
        const organizationId = req.user.organizationId;
        const { incidentId } = req.params;
        const incident = await prisma.alert.findFirst({
            where: { id: incidentId, organizationId },
            include: { notes: { orderBy: { createdAt: 'desc' } } }
        });
        if (!incident) {
            return reply.status(404).send({ error: "Incident not found" });
        }
        return reply.send({ success: true, data: incident });
    }
    async acknowledgeIncident(req, reply) {
        const organizationId = req.user.organizationId;
        const { incidentId } = req.params;
        const { assignedTo, slaDueInHours } = req.body;
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
    async addNote(req, reply) {
        const organizationId = req.user.organizationId;
        const userId = req.user.id;
        const { incidentId } = req.params;
        const { content } = req.body;
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
    async resolveIncident(req, reply) {
        const organizationId = req.user.organizationId;
        const { incidentId } = req.params;
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
exports.IncidentController = IncidentController;
class DeployController {
    async listDeployMarkers(req, reply) {
        const organizationId = req.user.organizationId;
        const { service, environment } = req.query;
        const where = { organizationId };
        if (service)
            where.service = service;
        if (environment)
            where.environment = environment;
        const markers = await prisma.deployMarker.findMany({
            where,
            orderBy: { deployedAt: 'desc' },
            take: 50
        });
        return reply.send({ success: true, data: markers });
    }
    async createDeployMarker(req, reply) {
        const organizationId = req.user.organizationId;
        const userId = req.user.id;
        const { service, version, environment, commitSha } = req.body;
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
exports.DeployController = DeployController;
class SloController {
    async listSlos(req, reply) {
        const organizationId = req.user.organizationId;
        const slos = await prisma.sloDefinition.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
        return reply.send({ success: true, data: slos });
    }
    async createSlo(req, reply) {
        const organizationId = req.user.organizationId;
        const { name, service, indicatorType, targetPercent, windowDays } = req.body;
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
    async deleteSlo(req, reply) {
        const organizationId = req.user.organizationId;
        const { sloId } = req.params;
        await prisma.sloDefinition.deleteMany({
            where: { id: sloId, organizationId }
        });
        return reply.send({ success: true });
    }
}
exports.SloController = SloController;
