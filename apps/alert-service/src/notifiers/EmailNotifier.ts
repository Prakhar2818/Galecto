import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import axios from "axios";

export class EmailNotifier extends BaseNotifier {
  async send(payload: NotificationPayload, channelConfig?: any): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.log(`[EmailNotifier] Brevo API key not configured, logging notification instead`);
      console.log(`[EmailNotifier] Would send email: ${payload.title} - ${payload.message}`);
      return;
    }

    let recipients: string[] = [];
    if (channelConfig?.recipients && Array.isArray(channelConfig.recipients)) {
      recipients = channelConfig.recipients;
    } else {
      recipients = (process.env.ALERT_EMAIL_RECIPIENTS || "").split(",").map(e => e.trim()).filter(Boolean);
    }
    if (recipients.length === 0) {
      console.log(`[EmailNotifier] No email recipients configured`);
      return;
    }

    const fromEmail = process.env.BREVO_FROM_EMAIL || "alerts@galecto.io";
    const severityColor = this.getSeverityColor(payload.severity);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 ${payload.title}</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">Severity:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">
                <span style="background: ${severityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${payload.severity}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${payload.service}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Time:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${payload.timestamp.toISOString()}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;">
            <p style="margin: 0; line-height: 1.6;">${payload.message}</p>
          </div>
          ${payload.eventData ? `
            <div style="margin-top: 20px;">
              <h4 style="margin-bottom: 10px;">Event Data:</h4>
              <pre style="background: #1a1a2e; color: #eee; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(payload.eventData, null, 2)}</pre>
            </div>
          ` : ''}
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
            Galecto Observability Platform | This alert was triggered by your monitoring rules
          </div>
        </div>
      </div>
    `;

    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { email: fromEmail, name: "Galecto Alerts" },
          to: recipients.map(email => ({ email })),
          subject: `[${payload.severity}] ${payload.title} - ${payload.service}`,
          htmlContent
        },
        {
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": apiKey
          }
        }
      );

      console.log(`[EmailNotifier] Sent email to ${recipients.length} recipients: ${payload.title}`);
    } catch (error: any) {
      console.error(`[EmailNotifier] Failed to send email:`, error.response?.data || error.message);
      throw error;
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "#dc3545";
      case "HIGH": return "#fd7e14";
      case "MEDIUM": return "#ffc107";
      case "LOW": return "#28a745";
      default: return "#6c757d";
    }
  }

  async test(channelConfig: any): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return false;

    try {
      const email = channelConfig.email || "test@example.com";
      await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: { email: process.env.BREVO_FROM_EMAIL || "alerts@galecto.io", name: "Galecto Alerts" },
          to: [{ email }],
          subject: "Galecto Alert Test",
          htmlContent: "<p>This is a test notification from Galecto Observability Platform.</p>"
        },
        {
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": apiKey
          }
        }
      );
      return true;
    } catch (error) {
      console.error(`[EmailNotifier] Test failed:`, error);
      return false;
    }
  }
}