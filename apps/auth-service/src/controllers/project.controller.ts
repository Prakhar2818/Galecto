import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, ProjectEnvironment } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export class ProjectController {
  
  async listProjects(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: { apiKeys: { where: { revokedAt: null } } }
    });
    return reply.send({ success: true, data: projects });
  }

  async createProject(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { name, environment, region } = req.body as { name: string; environment?: string; region?: string };

    const project = await prisma.project.create({
      data: {
        name,
        environment: (environment as ProjectEnvironment) || ProjectEnvironment.PRODUCTION,
        region,
        organizationId
      }
    });

    await prisma.apiKey.create({
      data: {
        name: "Default Key",
        key: `ag_${uuidv4().replace(/-/g, '')}`,
        projectId: project.id
      }
    });

    return reply.send({ success: true, data: project });
  }

  async generateKey(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { projectId } = req.params as { projectId: string };
    const { name, expiresInDays, scope } = req.body as { name: string; expiresInDays?: number; scope?: any };

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const key = await prisma.apiKey.create({
      data: {
        name,
        key: `ag_${uuidv4().replace(/-/g, '')}`,
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

  async rotateKey(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { keyId } = req.params as { keyId: string };

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
        key: `ag_${uuidv4().replace(/-/g, '')}`,
        projectId: oldKey.projectId,
        expiresAt: oldKey.expiresAt,
        scope: oldKey.scope as any
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

  async revokeKey(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { keyId } = req.params as { keyId: string };

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

  async listKeyAuditLogs(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;

    const logs = await prisma.apiKeyAuditLog.findMany({
      where: { organizationId },
      orderBy: { performedAt: 'desc' },
      take: 100
    });

    return reply.send({ success: true, data: logs });
  }
}
