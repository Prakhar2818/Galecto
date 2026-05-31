import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, ProjectEnvironment } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

console.log(">>> PROJECT CONTROLLER V2 LOADED <<<");

const prisma = new PrismaClient();

export class ProjectControllerV2 {
  
  async listProjects(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: { apiKeys: true }
    });
    console.log(`[DEBUG] listProjects for org ${organizationId}:`, JSON.stringify(projects, null, 2));
    return reply.send({ success: true, data: projects });
  }

  async createProject(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { name, environment, region } = req.body as { name: string; environment?: ProjectEnvironment; region?: string };

    const project = await prisma.project.create({
      data: {
        name,
        environment: environment || ProjectEnvironment.PRODUCTION,
        region,
        organizationId
      }
    });

    await prisma.apiKey.create({
      data: {
        name: "Default Key",
        key: `gl_${uuidv4().replace(/-/g, '')}`,
        projectId: project.id
      }
    });

    return reply.send({ success: true, data: project });
  }

  async generateKey(req: FastifyRequest, reply: FastifyReply) {
    const { projectId } = req.params as { projectId: string };
    const { name, expiresInDays } = req.body as { name: string; expiresInDays?: number };

    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const key = await prisma.apiKey.create({
      data: {
        name: name || "New API Key",
        key: `gl_${uuidv4().replace(/-/g, '')}`,
        projectId,
        expiresAt
      }
    });

    return reply.send({ success: true, data: { id: key.id, name: key.name, key: key.key, expiresAt: key.expiresAt } });
  }

  async revokeKey(req: FastifyRequest, reply: FastifyReply) {
    const { keyId } = req.params as { keyId: string };
    
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() }
    });

    return reply.send({ success: true });
  }

  async getProjectKeys(req: FastifyRequest, reply: FastifyReply) {
    const { projectId } = req.params as { projectId: string };
    
    const keys = await prisma.apiKey.findMany({
      where: { projectId, revokedAt: null }
    });

    return reply.send({ success: true, data: keys });
  }

  async rotateKey(req: FastifyRequest, reply: FastifyReply) {
    const { keyId } = req.params as { keyId: string };
    const newKey = `gl_${uuidv4().replace(/-/g, '')}`;

    const key = await prisma.apiKey.update({
      where: { id: keyId },
      data: { key: newKey }
    });

    return reply.send({ success: true, data: { id: key.id, key: key.key } });
  }

  async listKeyAuditLogs(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    
    const logs = await prisma.apiKeyAuditLog.findMany({
      where: { organizationId },
      orderBy: { performedAt: 'desc' }
    });

    return reply.send({ success: true, data: logs });
  }
}
