import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OrganizationController {
  
  async getSettings(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: { id: true, email: true, role: true, createdAt: true }
        }
      }
    });
    return reply.send({ success: true, data: org });
  }

  async updateSettings(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { name, retentionDays } = req.body as { name?: string; retentionDays?: number };

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (retentionDays !== undefined) {
      updateData.retentionDays = retentionDays;
    }

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return reply.send({ success: true, data: { name: org.name, retentionDays: org.retentionDays } });
  }
}