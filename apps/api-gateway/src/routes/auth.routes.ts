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

  app.get("/projects", async (req: any, reply) => {
    const headers = req.headers;
    const res = await authClient.listProjects(headers);
    return reply.send(res);
  });

  app.post("/projects", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const res = await authClient.createProject(data, headers);
    return reply.send(res);
  });

  app.post("/projects/:projectId/keys", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const { projectId } = req.params;
    const res = await authClient.generateProjectKey(projectId, data, headers);
    return reply.send(res);
  });

  app.get("/organization/settings", async (req: any, reply) => {
    const headers = req.headers;
    const res = await authClient.getOrganizationSettings(headers);
    return reply.send(res);
  });

  app.put("/organization/settings", async (req: any, reply) => {
    const data = req.body;
    const headers = req.headers;
    const res = await authClient.updateOrganizationSettings(data, headers);
    return reply.send(res);
  });
}
