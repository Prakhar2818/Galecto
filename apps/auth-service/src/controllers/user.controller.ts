import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export class UserController {
  
  async getUsers(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return reply.send({ success: true, data: users });
  }
  
  async inviteUser(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { email, role } = req.body as { email: string; role: string };
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // Check if already in same org
      if (existingUser.organizationId === organizationId) {
        return reply.status(400).send({ error: "User already in organization" });
      }
      // Different org - update
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { organizationId, role: (role as Role) || Role.DEVELOPER }
      });
      return reply.send({ success: true, message: "User added to organization" });
    }
    
    // Create new user with temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: (role as Role) || Role.DEVELOPER,
        organizationId
      }
    });
    
    return reply.send({ 
      success: true, 
      data: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tempPassword // In production, send via email
      } 
    });
  }
  
  async updateUserRole(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { userId } = req.params as { userId: string };
    const { role } = req.body as { role: string };
    
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId }
    });
    
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role }
    });
    
    return reply.send({ success: true });
  }
  
  async removeUser(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { userId } = req.params as { userId: string };
    
    // Can't remove yourself
    const currentUser = (req as any).user;
    if (currentUser.id === userId) {
      return reply.status(400).send({ error: "Cannot remove yourself" });
    }
    
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId }
    });
    
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return reply.send({ success: true });
  }
}