import { FastifyRequest, FastifyReply } from "fastify";
import { container } from "../container";
import { AuthService } from "../services/auth.service";
import { sendEvent } from "../../../../packages/kafka/src/producer";
import { EventType, IEvent } from "../../../../packages/types/src/index";
import { v4 as uuidv4 } from "uuid";

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
    const { email, password } = req.body as any;

    const service = container.resolve(AuthService);
    const user = await service.login(email, password);

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
}