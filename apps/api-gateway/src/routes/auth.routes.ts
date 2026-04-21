import { FastifyInstance } from "fastify";
import { AuthClient } from "../services/authClient";

export async function authRoutes(app: FastifyInstance) {
  const authClient = new AuthClient();

  app.post("/auth/register", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;

    const res = await authClient.register(data, headers);

    return reply.send(res);
  });

  app.post("/auth/login", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;

    const res = await authClient.login(data, headers);

    return reply.send(res);
  });
}