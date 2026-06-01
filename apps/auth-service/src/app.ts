import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.routes";
import { projectRoutes } from "./routes/project.routes";
import { organizationRoutes } from "./routes/organization.routes";
import { notificationRoutes } from "./routes/notification.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { incidentRoutes } from "./routes/incident.routes";
import { userRoutes } from "./routes/user.routes";
import { alertRuleRoutes } from "./routes/alert-rules.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { requestContextMiddleware } from "./middlewares/request-context.middleware";
import { loggingMiddleware, responseLoggingMiddleware } from "./middlewares/logger.middleware";

export function buildApp() {
  const app = Fastify();

  app.register(cors, { 
    origin: true,
    credentials: true
});

  app.addHook("onRequest", requestContextMiddleware);
  app.addHook("onRequest", loggingMiddleware);
  app.addHook("onResponse", responseLoggingMiddleware);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET environment variable must be at least 32 characters");
  }

  app.register(jwt, {
    secret: jwtSecret,
  });

  app.setErrorHandler(errorHandler);

  app.register(authRoutes, { prefix: "/auth" });
  app.register(projectRoutes, { prefix: "/projects" });
  app.register(organizationRoutes, { prefix: "/organization" });
  app.register(notificationRoutes, { prefix: "/notifications" });
  app.register(dashboardRoutes, { prefix: "/dashboards" });
  app.register(incidentRoutes, { prefix: "/platform" });
  app.register(userRoutes, { prefix: "/users" });
  app.register(alertRuleRoutes, { prefix: "/api/v1/platform/rules" });

  return app;
}
