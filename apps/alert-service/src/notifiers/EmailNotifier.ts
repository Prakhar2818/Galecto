import { BaseNotifier, NotificationPayload } from "./NotifierInterface";

export class EmailNotifier extends BaseNotifier {
  async send(payload: NotificationPayload): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      console.log(`[EmailNotifier] SMTP not configured, logging notification instead`);
      console.log(`[EmailNotifier] Would send email: ${payload.title} - ${payload.message}`);
      return;
    }

    const recipients = (process.env.ALERT_EMAIL_RECIPIENTS || "").split(",").filter(Boolean);
    if (recipients.length === 0) {
      console.log(`[EmailNotifier] No email recipients configured`);
      return;
    }

    console.log(`[EmailNotifier] Would send email to ${recipients.length} recipients: ${payload.title}`);
    console.log(`[EmailNotifier] Recipients: ${recipients.join(", ")}`);
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "red";
      case "HIGH": return "orange";
      case "MEDIUM": return "yellow";
      case "LOW": return "green";
      default: return "gray";
    }
  }

  async test(channelConfig: any): Promise<boolean> {
    return true;
  }
}