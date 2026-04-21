import { FastifyRequest, FastifyReply } from "fastify";
import { container } from "../container";
import { AuthService } from "../services/auth.service";

export class AuthController {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = req.body as any;

    const service = container.resolve(AuthService);
    const user = await service.register(email, password);

    return reply.send(user);
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = req.body as any;

    const service = container.resolve(AuthService);
    const user = await service.login(email, password);

    const token = (req.server as any).jwt.sign({
      id: user.id,
      role: user.role,
    });

    return reply.send({ token });
  }
}