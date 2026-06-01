import "dotenv/config";
import "./config/env";
import { buildApp } from "./app";

async function start() {
  const app = buildApp();

  try {
    const port = Number(process.env.PORT) || 3001;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`API Gateway running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();