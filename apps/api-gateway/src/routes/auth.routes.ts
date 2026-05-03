import { FastifyInstance } from "fastify";
import { AuthClient } from "../services/authClient";

export async function authRoutes(app: FastifyInstance) {
  const authClient = new AuthClient();

  app.post("/api/v1/auth/signup", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;

    const res = await authClient.register(data, headers);

    return reply.send(res);
  });

  app.post("/api/v1/auth/login", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;

    const res = await authClient.login(data, headers);

    return reply.send(res);
  });
}