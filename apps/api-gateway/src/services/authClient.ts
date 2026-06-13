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

  async setup2FA(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/auth/2fa/setup`,
      "POST",
      data,
      headers
    );
  }

  async verifyAndEnable2FA(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/auth/2fa/verify-enable`,
      "POST",
      data,
      headers
    );
  }

  async disable2FA(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/auth/2fa/disable`,
      "POST",
      data,
      headers
    );
  }

  async verifyEmailOTP(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/auth/verify-email-otp`,
      "POST",
      data,
      headers
    );
  }

  async acceptInvitation(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/users/accept-invitation`,
      "POST",
      data,
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

  async getNotificationChannels(headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/notifications`,
      "GET",
      undefined,
      headers
    );
  }

  async createNotificationChannel(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/notifications`,
      "POST",
      data,
      headers
    );
  }

  async updateNotificationChannel(id: string, data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/notifications/${id}`,
      "PUT",
      data,
      headers
    );
  }

  async deleteNotificationChannel(id: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/notifications/${id}`,
      "DELETE",
      undefined,
      headers
    );
  }

  async testNotificationChannel(id: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/notifications/${id}/test`,
      "POST",
      undefined,
      headers
    );
  }

  async triggerTestAlert(headers: any) {
    return httpRequest(
      `http://localhost:5003/api/v1/trigger-test-alert`,
      "POST",
      undefined,
      headers
    );
  }

  async getRules(headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/platform/rules`,
      "GET",
      undefined,
      headers
    );
  }

  async createRule(data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/platform/rules`,
      "POST",
      data,
      headers
    );
  }

  async updateRule(id: string, data: any, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/platform/rules/${id}`,
      "PUT",
      data,
      headers
    );
  }

  async deleteRule(id: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/platform/rules/${id}`,
      "DELETE",
      undefined,
      headers
    );
  }

  async testRule(id: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/platform/rules/${id}/test`,
      "POST",
      undefined,
      headers
    );
  }

  async getRuleExecutions(id: string, headers: any) {
    return httpRequest(
      `${AUTH_SERVICE_URL}/api/v1/platform/rules/${id}/executions`,
      "GET",
      undefined,
      headers
    );
  }
}
