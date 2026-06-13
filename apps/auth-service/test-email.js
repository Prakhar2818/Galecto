const axios = require('axios');

const BREVO_API_KEY = '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';
const BREVO_FROM_EMAIL = 'prakharattarde95@gmail.com';

async function sendTestEmail() {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: BREVO_FROM_EMAIL, name: 'Galecto Platform' },
        to: [{ email: 'prakharattarde95@gmail.com' }],
        subject: 'Galecto Platform — Test Email',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">Galecto Test Email</h1>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #334155;">
                This is a test email from the <strong>Galecto Observability Platform</strong>.
              </p>
              <p style="font-size: 14px; color: #64748b;">
                If you received this email, the Brevo email integration is working correctly.
              </p>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
                Galecto Platform | Test notification sent at ${new Date().toISOString()}
              </div>
            </div>
          </div>
        `
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY
        }
      }
    );

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', response.data.messageId);
  } catch (error) {
    console.error('❌ Failed to send test email:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

sendTestEmail();
