import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OrganizationController {
  
  async getSettings(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, retentionDays: true }
    });
    return reply.send({ success: true, data: org });
  }

  async updateSettings(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { retentionDays } = req.body as { retentionDays?: number };

    const updateData: any = {};
    if (retentionDays !== undefined) {
      updateData.retentionDays = retentionDays;
    }

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return reply.send({ success: true, data: { retentionDays: org.retentionDays } });
  }
}