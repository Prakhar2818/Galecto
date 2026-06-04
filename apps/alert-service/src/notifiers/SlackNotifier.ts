import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import axios from "axios";

export class SlackNotifier extends BaseNotifier {
  async send(payload: NotificationPayload): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log(`[SlackNotifier] Webhook URL not configured, logging notification instead`);
      console.log(`[SlackNotifier] Would send to Slack: ${payload.title} - ${payload.message}`);
      return;
    }

    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: `🚨 ${payload.title}`, emoji: true }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Severity:*\n${payload.severity}` },
          { type: "mrkdwn", text: `*Service:*\n${payload.service}` },
          { type: "mrkdwn", text: `*Time:*\n${payload.timestamp.toISOString()}` }
        ]
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: payload.message }
      }
    ];

    if (payload.eventData) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `\`\`\`${JSON.stringify(payload.eventData, null, 2)}\`\`\`` }
      });
    }

    try {
      await axios.post(webhookUrl, { blocks, text: `${payload.severity}: ${payload.title}` }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(`[SlackNotifier] Sent notification: ${payload.title}`);
    } catch (error) {
      console.error(`[SlackNotifier] Failed to send Slack notification:`, error);
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