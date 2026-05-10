"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./config/env");
require("./container");
const app_1 = require("./app");
async function start() {
    const app = (0, app_1.buildApp)();
    await app.listen({ port: Number(process.env.PORT) || 4000 });
    console.log("Auth Service running...");
}
start();
