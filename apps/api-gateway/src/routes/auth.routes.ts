import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthClient } from "../services/authClient";

async function jwtAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (request.method === "OPTIONS") {
    return reply.status(200).send();
  }
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

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

  app.get("/projects", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const headers = req.headers;
    const res = await authClient.listProjects(headers);
    return reply.send(res);
  });

  app.post("/projects", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const res = await authClient.createProject(data, headers);
    return reply.send(res);
  });

  app.post("/projects/:projectId/keys", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const { projectId } = req.params;
    const res = await authClient.generateProjectKey(projectId, data, headers);
    return reply.send(res);
  });

  app.get("/organization/settings", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const headers = req.headers;
    const res = await authClient.getOrganizationSettings(headers);
    return reply.send(res);
  });

  app.put("/organization/settings", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const res = await authClient.updateOrganizationSettings(data, headers);
    return reply.send(res);
  });

  // Users routes
  app.get("/users", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const headers = req.headers;
    const res = await authClient.getUsers(headers);
    return reply.send(res);
  });

  app.post("/users/invite", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const res = await authClient.inviteUser(data, headers);
    return reply.send(res);
  });

  app.put("/users/:userId/role", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const { userId } = req.params;
    const res = await authClient.updateUserRole(userId, data, headers);
    return reply.send(res);
  });

  app.delete("/users/:userId", { preHandler: [jwtAuthMiddleware] }, async (req: any, reply) => {
    const headers = req.headers;
    const { userId } = req.params;
    const res = await authClient.removeUser(userId, headers);
    return reply.send(res);
  });
}
