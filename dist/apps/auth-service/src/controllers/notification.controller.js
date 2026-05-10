"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationController {
    async listChannels(req, reply) {
        const organizationId = req.user.organizationId;
        const channels = await prisma.notificationChannel.findMany({
            where: { organizationId }
        });
        return reply.send({ success: true, data: channels });
    }
    async createChannel(req, reply) {
        const organizationId = req.user.organizationId;
        const { type, name, config } = req.body;
        const channel = await prisma.notificationChannel.create({
            data: {
                organizationId,
                type,
                name,
                config: JSON.stringify(config),
                enabled: true
            }
        });
        return reply.send({ success: true, data: channel });
    }
    async updateChannel(req, reply) {
        const organizationId = req.user.organizationId;
        const { channelId } = req.params;
        const { name, config, enabled } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (config)
            updateData.config = JSON.stringify(config);
        if (enabled !== undefined)
            updateData.enabled = enabled;
        const channel = await prisma.notificationChannel.updateMany({
            where: { id: channelId, organizationId },
            data: updateData
        });
        return reply.send({ success: true });
    }
    async deleteChannel(req, reply) {
        const organizationId = req.user.organizationId;
        const { channelId } = req.params;
        await prisma.notificationChannel.deleteMany({
            where: { id: channelId, organizationId }
        });
        return reply.send({ success: true });
    }
}
exports.NotificationController = NotificationController;
