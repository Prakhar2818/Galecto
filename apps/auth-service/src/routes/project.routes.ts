import { FastifyInstance } from "fastify";
import { ProjectController } from "../controllers/project.controller";

// Simple middleware to extract user from JWT (assuming it was verified by gateway or local)
// For this session, we'll just assume the user info is passed or we'll add a quick mock check
export async function projectRoutes(app: FastifyInstance) {
  const controller = new ProjectController();

  app.get("/", controller.listProjects);
  app.post("/", controller.createProject);
  app.post("/:projectId/keys", controller.generateKey);
}
