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

  async listProjects(headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/projects`,
      "GET",
      undefined,
      headers
    );
  }

  async createProject(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/projects`,
      "POST",
      data,
      headers
    );
  }

  async generateProjectKey(projectId: string, data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/projects/${projectId}/keys`,
      "POST",
      data,
      headers
    );
  }

  async getOrganizationSettings(headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/organization/settings`,
      "GET",
      undefined,
      headers
    );
  }

  async updateOrganizationSettings(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/organization/settings`,
      "PUT",
      data,
      headers
    );
  }
}
