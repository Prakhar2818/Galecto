import Fastify from "fastify";
import { routes } from "./routes";
import { requestContextMiddleware } from "./middleware/requestContext";
import { loggingMiddleware } from "./middleware/logger";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", requestContextMiddleware);
  app.addHook("onRequest", loggingMiddleware);

  app.register(routes);

  return app;
}