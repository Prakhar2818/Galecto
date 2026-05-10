"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthClient = void 0;
const httpClient_1 = require("./httpClient");
const AUTH_SERVICE_URL = "http://localhost:4000";
class AuthClient {
    async register(data, headers) {
        return (0, httpClient_1.httpRequest)(`${AUTH_SERVICE_URL}/auth/register`, "POST", data, headers);
    }
    async login(data, headers) {
        return (0, httpClient_1.httpRequest)(`${AUTH_SERVICE_URL}/auth/login`, "POST", data, headers);
    }
}
exports.AuthClient = AuthClient;
