import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export class ProjectController {
  
  async listProjects(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: { apiKeys: true }
    });
    return reply.send({ success: true, data: projects });
  }

  async createProject(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { name } = req.body as { name: string };

    const project = await prisma.project.create({
      data: {
        name,
        organizationId
      }
    });

    // Automatically create first API key
    await prisma.apiKey.create({
      data: {
        name: "Default Production Key",
        key: `ag_${uuidv4().replace(/-/g, '')}`,
        projectId: project.id
      }
    });

    return reply.send({ success: true, data: project });
  }

  async generateKey(req: FastifyRequest, reply: FastifyReply) {
    const { projectId } = req.params as { projectId: string };
    const { name } = req.body as { name: string };

    const key = await prisma.apiKey.create({
      data: {
        name,
        key: `ag_${uuidv4().replace(/-/g, '')}`,
        projectId
      }
    });

    return reply.send({ success: true, data: key });
  }
}
