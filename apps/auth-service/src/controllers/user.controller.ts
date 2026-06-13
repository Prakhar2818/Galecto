import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, Role, InvitationStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const prisma = new PrismaClient();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "invites@galecto.io";

async function sendBrevoEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.log(`[Brevo] API key not configured. Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: BREVO_FROM_EMAIL, name: "Galecto" },
        to: [{ email: to }],
        subject,
        htmlContent
      },
      {
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": BREVO_API_KEY
        }
      }
    );
    return true;
  } catch (error: any) {
    console.error(`[Brevo] Failed to send email:`, error.response?.data || error.message);
    return false;
  }
}

function getInvitationEmailTemplate(inviteUrl: string, orgName: string, inviterEmail: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">Galecto Invitation</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #334155; margin-bottom: 16px;">
          You've been invited to join <strong>${orgName}</strong> on Galecto by ${inviterEmail}.
        </p>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
          Click the button below to accept your invitation and set up your account. This link expires in 24 hours.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Accept Invitation
        </a>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </div>
      </div>
    </div>
  `;
}

export class UserController {
  
  async getUsers(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    
    const [users, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.invitation.findMany({
        where: { organizationId, status: InvitationStatus.PENDING },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          expiresAt: true
        }
      })
    ]);
    
    // Combine users and pending invitations into a single list
    const combined = [
      ...users.map(u => ({ ...u, memberStatus: 'ACTIVE' as const })),
      ...invitations.map(i => ({ 
        id: i.id, 
        email: i.email, 
        role: i.role, 
        createdAt: i.createdAt,
        updatedAt: i.createdAt,
        memberStatus: 'PENDING' as const,
        expiresAt: i.expiresAt
      }))
    ];
    
    return reply.send({ success: true, data: combined });
  }
  
  async inviteUser(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const inviterEmail = (req as any).user.email;
    const { email, role } = req.body as { email: string; role: string };
    
    // Check if user already exists in this organization
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser && existingUser.organizationId === organizationId) {
      return reply.status(400).send({ error: "User already in organization" });
    }
    
    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findUnique({
      where: { email_organizationId: { email, organizationId } }
    });
    
    if (existingInvitation && existingInvitation.status === InvitationStatus.PENDING) {
      if (existingInvitation.expiresAt > new Date()) {
        return reply.status(400).send({ error: "Invitation already sent to this user" });
      }
      // Expired invitation - delete and create new one
      await prisma.invitation.delete({ where: { id: existingInvitation.id } });
    }
    
    // Create invitation token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: (role as Role) || Role.DEVELOPER,
        organizationId,
        token,
        status: InvitationStatus.PENDING,
        expiresAt
      }
    });
    
    // Get organization name
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true }
    });
    
    // Send invitation email
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invitation?token=${token}`;
    
    try {
      const sent = await sendBrevoEmail(
        email,
        `Invitation to join ${org?.name || 'Galecto'}`,
        getInvitationEmailTemplate(inviteUrl, org?.name || 'Galecto', inviterEmail)
      );
      if (!sent) {
        console.log(`[Invitation] Brevo not configured. Invitation URL: ${inviteUrl}`);
      }
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the invitation if email fails - log the URL
    }
    
    return reply.send({ 
      success: true, 
      data: { 
        id: invitation.id, 
        email: invitation.email, 
        role: invitation.role,
        status: 'PENDING',
        expiresAt: invitation.expiresAt
      } 
    });
  }
  
  async acceptInvitation(req: FastifyRequest, reply: FastifyReply) {
    const { token } = req.query as { token: string };
    const { password } = req.body as { password: string };
    
    if (!token || !password) {
      return reply.status(400).send({ error: "Token and password are required" });
    }
    
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });
    
    if (!invitation) {
      return reply.status(404).send({ error: "Invalid invitation token" });
    }
    
    if (invitation.status !== InvitationStatus.PENDING) {
      return reply.status(400).send({ error: "Invitation has already been used or expired" });
    }
    
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED }
      });
      return reply.status(400).send({ error: "Invitation has expired" });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });
    
    if (existingUser) {
      // Update existing user to new organization
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          organizationId: invitation.organizationId,
          role: invitation.role
        }
      });
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
          organizationId: invitation.organizationId
        }
      });
    }
    
    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() }
    });
    
    return reply.send({ success: true, message: "Invitation accepted successfully" });
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