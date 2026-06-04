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
    const res = await httpRequest(
      `${AUTH_SERVICE_URL}/projects`,
      "GET",
      undefined,
      headers
    );
    console.log("[GATEWAY DEBUG] listProjects response:", JSON.stringify(res, null, 2));
    return res;
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

  async getUsers(headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/users`,
      "GET",
      undefined,
      headers
    );
  }

  async inviteUser(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/users/invite`,
      "POST",
      data,
      headers
    );
  }

  async updateUserRole(userId: string, data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/users/${userId}/role`,
      "PUT",
      data,
      headers
    );
  }

  async removeUser(userId: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/users/${userId}`,
      "DELETE",
      undefined,
      headers
    );
  }

  async getSloTargets(headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/platform/slo/targets`,
      "GET",
      undefined,
      headers
    );
  }

  async upsertSloTarget(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/platform/slo/targets`,
      "PUT",
      data,
      headers
    );
  }

  async deleteSloTarget(serviceName: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/platform/slo/targets/${encodeURIComponent(serviceName)}`,
      "DELETE",
      undefined,
      headers
    );
  }
}
