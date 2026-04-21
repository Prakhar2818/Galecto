import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.post("/register", controller.register);
  app.post("/login", controller.login);
}