"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
class ProjectController {
    async listProjects(req, reply) {
        const organizationId = req.user.organizationId;
        const projects = await prisma.project.findMany({
            where: { organizationId },
            include: { apiKeys: { where: { revokedAt: null } } }
        });
        return reply.send({ success: true, data: projects });
    }
    async createProject(req, reply) {
        const organizationId = req.user.organizationId;
        const { name, environment, region } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                environment: environment || client_1.ProjectEnvironment.PRODUCTION,
                region,
                organizationId
            }
        });
        await prisma.apiKey.create({
            data: {
                name: "Default Key",
                key: `ag_${(0, uuid_1.v4)().replace(/-/g, '')}`,
                projectId: project.id
            }
        });
        return reply.send({ success: true, data: project });
    }
    async generateKey(req, reply) {
        const organizationId = req.user.organizationId;
        const { projectId } = req.params;
        const { name, expiresInDays, scope } = req.body;
        const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
        const key = await prisma.apiKey.create({
            data: {
                name,
                key: `ag_${(0, uuid_1.v4)().replace(/-/g, '')}`,
                projectId,
                expiresAt,
                scope: scope || { ingest: true, read: true, write: true }
            }
        });
        await prisma.apiKeyAuditLog.create({
            data: {
                organizationId,
                apiKeyId: key.id,
                action: "CREATED",
                metadata: { keyName: name, expiresAt }
            }
        });
        return reply.send({ success: true, data: key });
    }
    async rotateKey(req, reply) {
        const organizationId = req.user.organizationId;
        const { keyId } = req.params;
        const oldKey = await prisma.apiKey.findFirst({
            where: { id: keyId, project: { organizationId } }
        });
        if (!oldKey) {
            return reply.status(404).send({ error: "Key not found" });
        }
        await prisma.apiKey.update({
            where: { id: keyId },
            data: { revokedAt: new Date() }
        });
        const newKey = await prisma.apiKey.create({
            data: {
                name: `${oldKey.name} (Rotated)`,
                key: `ag_${(0, uuid_1.v4)().replace(/-/g, '')}`,
                projectId: oldKey.projectId,
                expiresAt: oldKey.expiresAt,
                scope: oldKey.scope
            }
        });
        await prisma.apiKeyAuditLog.create({
            data: {
                organizationId,
                apiKeyId: oldKey.id,
                action: "ROTATED",
                metadata: { newKeyId: newKey.id }
            }
        });
        return reply.send({ success: true, data: newKey });
    }
    async revokeKey(req, reply) {
        const organizationId = req.user.organizationId;
        const { keyId } = req.params;
        const key = await prisma.apiKey.findFirst({
            where: { id: keyId, project: { organizationId } }
        });
        if (!key) {
            return reply.status(404).send({ error: "Key not found" });
        }
        await prisma.apiKey.update({
            where: { id: keyId },
            data: { revokedAt: new Date() }
        });
        await prisma.apiKeyAuditLog.create({
            data: {
                organizationId,
                apiKeyId: keyId,
                action: "REVOKED",
                metadata: { keyName: key.name }
            }
        });
        return reply.send({ success: true });
    }
    async listKeyAuditLogs(req, reply) {
        const organizationId = req.user.organizationId;
        const logs = await prisma.apiKeyAuditLog.findMany({
            where: { organizationId },
            orderBy: { performedAt: 'desc' },
            take: 100
        });
        return reply.send({ success: true, data: logs });
    }
}
exports.ProjectController = ProjectController;
