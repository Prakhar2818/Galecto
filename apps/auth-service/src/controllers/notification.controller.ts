import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class NotificationController {
  
  async listChannels(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    
    const channels = await prisma.notificationChannel.findMany({
      where: { organizationId }
    });
    
    return reply.send({ success: true, data: channels });
  }

  async createChannel(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { type, name, config } = req.body as any;

    const channel = await prisma.notificationChannel.create({
      data: {
        organizationId,
        type,
        name,
        config,
        enabled: true
      }
    });

    return reply.send({ success: true, data: channel });
  }

  async updateChannel(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { channelId } = req.params as { channelId: string };
    const { name, config, enabled } = req.body as any;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (config) updateData.config = config;
    if (enabled !== undefined) updateData.enabled = enabled;

    const channel = await prisma.notificationChannel.updateMany({
      where: { id: channelId, organizationId },
      data: updateData
    });

    return reply.send({ success: true });
  }

  async deleteChannel(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { channelId } = req.params as { channelId: string };

    await prisma.notificationChannel.deleteMany({
      where: { id: channelId, organizationId }
    });

    return reply.send({ success: true });
  }
}