import "reflect-metadata";
import "./config/env";
import "./container";
import { buildApp } from "./app";

async function start() {
  const app = buildApp();

  await app.listen({ port: Number(process.env.PORT) || 4000 });

  console.log("Auth Service running...");
}

start();
