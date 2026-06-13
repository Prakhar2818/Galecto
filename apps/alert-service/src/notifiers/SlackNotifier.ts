import { BaseNotifier, NotificationPayload } from "./NotifierInterface";
import axios from "axios";

function normalizeConfig(channelConfig?: any): any {
  if (typeof channelConfig === 'string') {
    try {
      return JSON.parse(channelConfig);
    } catch {
      return {};
    }
  }
  return channelConfig || {};
}

export class SlackNotifier extends BaseNotifier {
  async send(payload: NotificationPayload, channelConfig?: any): Promise<void> {
    const config = normalizeConfig(channelConfig);
    const webhookUrl = config.webhook_url;
    console.log(`[SlackNotifier] webhook_url present=${!!webhookUrl}`);
    if (!webhookUrl) {
      console.log(`[SlackNotifier] Webhook URL not configured in channel config, logging notification instead`);
      console.log(`[SlackNotifier] Would send to Slack: ${payload.title} - ${payload.message}`);
      return;
    }

    // Validate Slack webhook URL format
    if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      console.error(`[SlackNotifier] Invalid webhook URL format: ${webhookUrl.substring(0, 40)}...`);
      console.error(`[SlackNotifier] Expected format: https://hooks.slack.com/services/T.../B.../...`);
      throw new Error(`Invalid Slack webhook URL format`);
    }

    const severityEmoji = this.getSeverityEmoji(payload.severity);

    const slackMessage: any = {
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `${severityEmoji} ${payload.title}`, emoji: true }
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
      ]
    };

    if (payload.eventData) {
      slackMessage.blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `\`\`\`${JSON.stringify(payload.eventData, null, 2)}\`\`\`` }
      });
    }

    slackMessage.blocks.push({ type: "divider" });

    slackMessage.blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: "Sent by *Galecto Observability Platform*" }
      ]
    });

    try {
      await axios.post(webhookUrl, slackMessage, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(`[SlackNotifier] Sent notification: ${payload.title}`);
    } catch (error) {
      console.error(`[SlackNotifier] Failed to send Slack notification:`, error);
      throw error;
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "🔥";
      case "HIGH": return "⚠️";
      case "MEDIUM": return "📋";
      case "LOW": return "ℹ️";
      default: return "📢";
    }
  }

  async test(channelConfig?: any): Promise<boolean> {
    const config = normalizeConfig(channelConfig);
    const webhookUrl = config.webhook_url;
    if (!webhookUrl) {
      console.log(`[SlackNotifier] No webhook URL configured in channel config for test`);
      return false;
    }
    try {
      const testMessage: any = {
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: "✅ *Galecto Alert Test*\n\nThis is a test notification from Galecto Observability Platform." }
          }
        ]
      };
      await axios.post(webhookUrl, testMessage, {
        headers: { "Content-Type": "application/json" }
      });
      return true;
    } catch (error) {
      console.error(`[SlackNotifier] Test failed:`, error);
      return false;
    }
  }
}