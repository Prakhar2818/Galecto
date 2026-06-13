import { FastifyRequest, FastifyReply } from "fastify";
import { container } from "../container";
import { AuthService } from "../services/auth.service";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/api-types/src/index";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import axios from "axios";

const prisma = new PrismaClient();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "security@galecto.io";

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

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a TOTP secret (base32)
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Simple TOTP verification using time step
function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  
  for (let i = -window; i <= window; i++) {
    const counter = Math.floor((now + i * timeStep) / timeStep);
    const expected = generateTOTPAtCounter(secret, counter);
    if (expected === token) {
      return true;
    }
  }
  return false;
}

function generateTOTPAtCounter(secret: string, counter: number): string {
  // Simple HMAC-SHA1 simulation for TOTP
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(counterBuffer);
  const digest = hmac.digest();
  
  const offset = digest[digest.length - 1] & 0x0f;
  const code = ((digest[offset] & 0x7f) << 24 |
                (digest[offset + 1] & 0xff) << 16 |
                (digest[offset + 2] & 0xff) << 8 |
                (digest[offset + 3] & 0xff)) % 1000000;
  
  return code.toString().padStart(6, '0');
}

export class AuthController {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const { email, password, organizationName } = req.body as any;

    const service = container.resolve(AuthService);
    const { user, org } = await service.register(email, password, organizationName);

    const traceId = req.headers["x-trace-id"] as string || uuidv4();
    const parentSpanId = req.headers["x-span-id"] as string | undefined;
    
    const event: IEvent = {
      eventId: uuidv4(),
      traceId,
      spanId: uuidv4(),
      parentSpanId,
      tenantId: org.id,
      type: EventType.LOG,
      service: "auth-service",
      name: "USER_REGISTERED",
      timestamp: Date.now(),
      payload: { userId: user.id, email: user.email, organizationId: org.id },
    };
    sendEvent("events", event).catch(console.error);

    // Generate token for immediate login after signup
    const token = (req.server as any).jwt.sign({
      id: user.id,
      role: (user as any).role || "USER",
      organizationId: org.id,
    });

    return reply.send({ success: true, user, token });
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const { email, password, otpCode } = req.body as any;

    const service = container.resolve(AuthService);
    const user = await service.login(email, password);

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!otpCode) {
        return reply.send({ 
          success: false, 
          requires2FA: true, 
          twoFactorMethod: user.twoFactorMethod 
        });
      }

      // Verify OTP
      if (user.twoFactorMethod === 'email') {
        // For email OTP, we need a separate verification endpoint
        // For now, check the stored OTP (this would be stored in a separate table in production)
        return reply.send({ 
          success: false, 
          requires2FA: true, 
          message: 'Please verify your email OTP'
        });
      } else if (user.twoFactorMethod === 'authenticator') {
        if (!user.twoFactorSecret || !verifyTOTP(user.twoFactorSecret, otpCode)) {
          return reply.status(401).send({ error: "Invalid 2FA code" });
        }
      }
    }

    const token = (req.server as any).jwt.sign({
      id: user.id,
      role: (user as any).role || "USER",
      organizationId: user.organizationId,
    });

    const traceId = req.headers["x-trace-id"] as string || uuidv4();
    const parentSpanId = req.headers["x-span-id"] as string | undefined;

    const event: IEvent = {
      eventId: uuidv4(),
      traceId,
      spanId: uuidv4(),
      parentSpanId,
      tenantId: user.organizationId,
      type: EventType.LOG,
      service: "auth-service",
      name: "USER_LOGGED_IN",
      timestamp: Date.now(),
      payload: { userId: user.id, email: user.email },
    };
    sendEvent("events", event).catch(console.error);

    return reply.send({ success: true, token, user });
  }

  async setup2FA(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const { method } = req.body as { method: 'email' | 'authenticator' };
    
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return reply.status(404).send({ error: "User not found" });
    }
    
    if (method === 'email') {
      // Generate and send email OTP
      const otpCode = generateOTP();
      const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false, // Will be enabled after verification
          twoFactorSecret: `${otpHash}:${expiresAt.toISOString()}`,
          twoFactorMethod: 'email'
        }
      });
      
      // Send OTP email
      try {
        const sent = await sendBrevoEmail(
          dbUser.email,
          'Your Galecto Verification Code',
          `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
              <h2 style="color: #10b981;">Galecto Security</h2>
              <p style="font-size: 14px; color: #64748b;">Your verification code is:</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; margin: 20px 0;">${otpCode}</div>
              <p style="font-size: 12px; color: #94a3b8;">This code expires in 10 minutes.</p>
            </div>
          `
        );
        if (!sent) {
          console.log(`[2FA Email] OTP for ${dbUser.email}: ${otpCode}`);
        }
      } catch (emailError) {
        console.error('Failed to send 2FA email:', emailError);
      }
      
      return reply.send({ 
        success: true, 
        message: 'Verification code sent to your email',
        method: 'email'
      });
    } else if (method === 'authenticator') {
      const secret = generateTOTPSecret();
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const otpauthUrl = `otpauth://totp/Galecto:${dbUser.email}?secret=${secret}&issuer=Galecto`;
      
      // Store secret temporarily (will be confirmed after verification)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: secret,
          twoFactorMethod: 'authenticator'
        }
      });
      
      return reply.send({
        success: true,
        method: 'authenticator',
        secret,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
      });
    }
    
    return reply.status(400).send({ error: "Invalid 2FA method" });
  }

  async verifyAndEnable2FA(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const { code } = req.body as { code: string };
    
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.twoFactorSecret) {
      return reply.status(400).send({ error: "2FA not set up" });
    }
    
    if (dbUser.twoFactorMethod === 'email') {
      // Verify email OTP
      const [storedHash, expiresAt] = dbUser.twoFactorSecret.split(':');
      if (new Date(expiresAt) < new Date()) {
        return reply.status(400).send({ error: "OTP has expired" });
      }
      
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      if (codeHash !== storedHash) {
        return reply.status(400).send({ error: "Invalid verification code" });
      }
    } else if (dbUser.twoFactorMethod === 'authenticator') {
      if (!verifyTOTP(dbUser.twoFactorSecret, code)) {
        return reply.status(400).send({ error: "Invalid TOTP code" });
      }
    }
    
    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });
    
    return reply.send({ success: true, message: "2FA enabled successfully" });
  }

  async disable2FA(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user;
    const { password } = req.body as { password: string };
    
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    
    const service = container.resolve(AuthService);
    try {
      await service.login(user.email, password); // Verify password
    } catch {
      return reply.status(400).send({ error: "Invalid password" });
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorMethod: null
      }
    });
    
    return reply.send({ success: true, message: "2FA disabled successfully" });
  }

  async verifyEmailOTP(req: FastifyRequest, reply: FastifyReply) {
    const { email, code } = req.body as { email: string; code: string };
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorSecret || user.twoFactorMethod !== 'email') {
      return reply.status(400).send({ error: "No pending OTP verification" });
    }
    
    const [storedHash, expiresAt] = user.twoFactorSecret.split(':');
    if (new Date(expiresAt) < new Date()) {
      return reply.status(400).send({ error: "OTP has expired" });
    }
    
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== storedHash) {
      return reply.status(400).send({ error: "Invalid OTP" });
    }
    
    // Generate JWT token
    const token = (req.server as any).jwt.sign({
      id: user.id,
      role: user.role || "USER",
      organizationId: user.organizationId,
    });
    
    return reply.send({ success: true, token, user });
  }
}