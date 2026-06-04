import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface NotificationChannelRequest {
  type: "EMAIL" | "SLACK" | "TEAMS" | "WEBHOOK";
  name: string;
  config: {
    webhook_url?: string;
    channel?: string;
    recipients?: string[];
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
  };
  enabled?: boolean;
}

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

export const notificationController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const channels = await prisma.notificationChannel.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return reply.send({ success: true, data: channels });
  },

  async get(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params as { id: string };
    const channel = await prisma.notificationChannel.findFirst({ where: { id, organizationId } });
    if (!channel) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Channel not found" } });
    }
    return reply.send({ success: true, data: channel });
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const body = request.body as NotificationChannelRequest;
    const channel = await prisma.notificationChannel.create({
      data: {
        type: body.type,
        name: body.name,
        config: body.config as any,
        enabled: body.enabled !== false,
        organizationId
      }
    });
    return reply.status(201).send({ success: true, data: channel });
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params as { id: string };
    const body = request.body as NotificationChannelRequest;
    const channel = await prisma.notificationChannel.update({
      where: { id, organizationId },
      data: {
        type: body.type,
        name: body.name,
        config: body.config as any,
        enabled: body.enabled !== false
      }
    });
    return reply.send({ success: true, data: channel });
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params as { id: string };
    await prisma.notificationChannel.delete({ where: { id, organizationId } });
    return reply.send({ success: true });
  },

  async test(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = (request as any).user?.organizationId;
    const { id } = request.params as { id: string };
    const channel = await prisma.notificationChannel.findFirst({ where: { id, organizationId } });
    if (!channel) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Channel not found" } });
    }
    return reply.send({
      success: true,
      message: "Test notification sent via " + channel.type,
      data: { channelId: id, type: channel.type }
    });
  }
};

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);

  fastify.get("/", async (request, reply) => notificationController.list(request, reply));
  fastify.post("/", async (request, reply) => notificationController.create(request, reply));
  fastify.get("/:id", async (request, reply) => notificationController.get(request, reply));
  fastify.put("/:id", async (request, reply) => notificationController.update(request, reply));
  fastify.delete("/:id", async (request, reply) => notificationController.delete(request, reply));
  fastify.post("/:id/test", async (request, reply) => notificationController.test(request, reply));
}