import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import axios from "axios";

export class TeamsNotifier extends BaseNotifier {
  async send(payload: NotificationPayload): Promise<void> {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log(`[TeamsNotifier] Webhook URL not configured, logging notification instead`);
      console.log(`[TeamsNotifier] Would send to Teams: ${payload.title} - ${payload.message}`);
      return;
    }

    const card = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: this.getSeverityColor(payload.severity),
      summary: payload.title,
      sections: [{
        activityTitle: payload.title,
        activitySubtitle: payload.service,
        facts: [
          { name: "Severity", value: payload.severity },
          { name: "Time", value: payload.timestamp.toISOString() },
          { name: "Message", value: payload.message }
        ],
        text: payload.eventData ? JSON.stringify(payload.eventData, null, 2) : undefined
      }]
    };

    try {
      await axios.post(webhookUrl, card, { headers: { "Content-Type": "application/json" } });
      console.log(`[TeamsNotifier] Sent notification: ${payload.title}`);
    } catch (error) {
      console.error(`[TeamsNotifier] Failed to send Teams notification:`, error);
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

  async test(channelConfig: { webhook_url: string }): Promise<boolean> {
    try {
      await axios.post(channelConfig.webhook_url, { text: "✅ Galecto Alert Test" });
      return true;
    } catch (error) {
      return false;
    }
  }
}