import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.routes";
import { projectRoutes } from "./routes/project.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { requestContextMiddleware } from "./middlewares/request-context.middleware";
import { loggingMiddleware, responseLoggingMiddleware } from "./middlewares/logger.middleware";

export function buildApp() {
  const app = Fastify();

  app.register(cors, { origin: "*" });

  app.addHook("onRequest", requestContextMiddleware);
  app.addHook("onRequest", loggingMiddleware);
  app.addHook("onResponse", responseLoggingMiddleware);

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "secret",
  });

  app.setErrorHandler(errorHandler);

  app.register(authRoutes, { prefix: "/auth" });
  app.register(projectRoutes, { prefix: "/projects" });

  return app;
}
