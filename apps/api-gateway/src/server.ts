import { buildApp } from "./app";

async function start() {
  const app = buildApp();

  try {
    await app.listen({ port: 3000 });
    console.log("API Gateway running on port 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();