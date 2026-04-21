import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";

export function buildApp() {
  const app = Fastify();

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "secret",
  });

  app.setErrorHandler(errorHandler);

  app.register(authRoutes, { prefix: "/auth" });

  return app;
}