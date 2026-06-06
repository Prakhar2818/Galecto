import { Notifier, NotificationPayload } from "./NotifierInterface";
import { SlackNotifier } from "./SlackNotifier";
import { TeamsNotifier } from "./TeamsNotifier";
import { EmailNotifier } from "./EmailNotifier";

export class NotificationService {
  private notifiers: Map<string, Notifier> = new Map();

  constructor() {
    this.notifiers.set("SLACK", new SlackNotifier());
    this.notifiers.set("TEAMS", new TeamsNotifier());
    this.notifiers.set("EMAIL", new EmailNotifier());
  }

  async sendNotification(channelType: string, payload: NotificationPayload, channelConfig?: any): Promise<void> {
    const notifier = this.notifiers.get(channelType);
    if (!notifier) {
      console.log(`[NotificationService] Unsupported channel type: ${channelType}`);
      return;
    }
    await notifier.send(payload, channelConfig);
  }

  async sendToAllChannels(channels: { type: string; config: any }[], payload: NotificationPayload): Promise<void> {
    const promises = channels.map(channel =>
      this.sendNotification(channel.type, payload, channel.config).catch(error => {
        console.error(`[NotificationService] Failed to send to channel ${channel.type}:`, error);
      })
    );
    await Promise.all(promises);
  }

  async testChannel(channelType: string, config: any): Promise<boolean> {
    const notifier = this.notifiers.get(channelType);
    if (!notifier) return false;
    return notifier.test(config);
  }
}

export const notificationService = new NotificationService();