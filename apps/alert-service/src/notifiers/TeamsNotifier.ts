import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import axios from "axios";

export class TeamsNotifier extends BaseNotifier {
  async send(payload: NotificationPayload, channelConfig?: any): Promise<void> {
    const webhookUrl = channelConfig?.webhook_url || process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log(`[TeamsNotifier] Webhook URL not configured. To enable Teams notifications:`);
      console.log(`[TeamsNotifier] 1. Go to your Teams channel → Manage channel → Connectors`);
      console.log(`[TeamsNotifier] 2. Add Incoming Webhook, copy the URL`);
      console.log(`[TeamsNotifier] 3. Set TEAMS_WEBHOOK_URL in your environment`);
      console.log(`[TeamsNotifier] Skipping Teams notification: ${payload.title} - ${payload.message}`);
      return;
    }

    const color = this.getSeverityColor(payload.severity);

    const card: any = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: color,
      summary: payload.title,
      title: payload.title,
      text: payload.message,
      sections: [
        {
          activityTitle: `📢 ${payload.title}`,
          activitySubtitle: payload.service,
          facts: [
            { name: "Severity", value: payload.severity },
            { name: "Service", value: payload.service },
            { name: "Time", value: payload.timestamp.toISOString() },
            { name: "Message", value: payload.message }
          ],
          text: payload.message
        }
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View in Galecto",
          targets: [{ os: "default", uri: process.env.GALECTO_UI_URL || "https://app.galecto.io" }]
        }
      ]
    };

    if (payload.eventData) {
      card.sections.push({
        activityTitle: "Event Data",
        activitySubtitle: "",
        facts: Object.entries(payload.eventData).slice(0, 5).map(([key, value]) => ({
          name: key,
          value: String(value)
        }))
      });
    }

    try {
      await axios.post(webhookUrl, card, { headers: { "Content-Type": "application/json" } });
      console.log(`[TeamsNotifier] Sent notification: ${payload.title}`);
    } catch (error) {
      console.error(`[TeamsNotifier] Failed to send Teams notification:`, error);
      throw error;
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "FF0000";
      case "HIGH": return "FFA500";
      case "MEDIUM": return "FFFF00";
      case "LOW": return "00FF00";
      default: return "808080";
    }
  }

  async test(channelConfig: { webhook_url?: string }): Promise<boolean> {
    const webhookUrl = channelConfig.webhook_url || process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log(`[TeamsNotifier] No webhook URL configured for test`);
      return false;
    }
    try {
      const card: any = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "00FF00",
        summary: "Galecto Alert Test",
        title: "✅ Galecto Alert Test",
        text: "This is a test notification from Galecto Observability Platform.",
        sections: [{
          activityTitle: "Test Successful",
          facts: [{ name: "Status", value: "Teams integration is working!" }]
        }]
      };
      await axios.post(webhookUrl, card, { headers: { "Content-Type": "application/json" } });
      return true;
    } catch (error) {
      console.error(`[TeamsNotifier] Test failed:`, error);
      return false;
    }
  }
}