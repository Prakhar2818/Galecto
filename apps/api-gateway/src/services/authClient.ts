import { httpRequest } from "./httpClient";

const AUTH_SERVICE_URL = "http://localhost:4000";

export class AuthClient {
  async register(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/auth/register`,
      "POST",
      data,
      headers
    );
  }

  async login(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/auth/login`,
      "POST",
      data,
      headers
    );
  }
}