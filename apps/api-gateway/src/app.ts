import Fastify from "fastify";
import { routes } from "./routes";
import { requestContextMiddleware } from "./middleware/requestContext";
import { loggingMiddleware } from "./middleware/logger";
import { authRoutes } from "./routes/auth.routes";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", requestContextMiddleware);
  app.addHook("onRequest", loggingMiddleware);

  app.register(routes);
  app.register(authRoutes)

  return app;
}