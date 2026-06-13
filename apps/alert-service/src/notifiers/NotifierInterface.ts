export interface NotificationPayload {
  title: string;
  message: string;
  severity: string;
  service: string;
  eventData?: any;
  timestamp: Date;
  userEmails?: string[];
}

export interface Notifier {
  send(payload: NotificationPayload, channelConfig?: any): Promise<void>;
  test(channelConfig: any): Promise<boolean>;
}

export abstract class BaseNotifier implements Notifier {
  abstract send(payload: NotificationPayload, channelConfig?: any): Promise<void>;
  abstract test(channelConfig: any): Promise<boolean>;

  protected formatMessage(payload: NotificationPayload): string {
    return `
🚨 *${payload.title}*

*Severity:* ${payload.severity}
*Service:* ${payload.service}
*Time:* ${payload.timestamp.toISOString()}

${payload.message}

${payload.eventData ? `\`\`\`\n${JSON.stringify(payload.eventData, null, 2)}\n\`\`\`` : ''}
    `.trim();
  }
}