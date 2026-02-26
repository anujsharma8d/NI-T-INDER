import { BrevoClient } from '@getbrevo/brevo';

export async function sendOTPEmail(email, otp) {
  // Check if Brevo API key is configured
  if (!process.env.BREVO_API_KEY) {
    console.log('[EMAIL] No Brevo API key found. Logging OTP to console.');
    console.log(`[OTP] Code for ${email}: ${otp}`);
    return false;
  }

  try {
    // Initialize Brevo API client
    const brevoClient = new BrevoClient({ 
      apiKey: process.env.BREVO_API_KEY
    });
    let apiInstance = brevoClient.transactionalEmails;

    // Prepare email
    let sendSmtpEmail = {
      subject: 'Your NITinder Verification Code',
      sender: { 
        name: 'NITinder', 
        email: process.env.SMTP_FROM || 'anujsharma8d@gmail.com' 
      },
      to: [{ email: email }],
      htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff8e72 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f8f9fa; border: 2px dashed #ff6b6b; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: 700; color: #ff6b6b; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
          p { line-height: 1.6; color: #333; }
          .warning { color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 NITinder</h1>
          </div>
          <div class="content">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
            <p>Hello!</p>
            <p>Thank you for registering with NITinder. Please use the verification code below to complete your registration:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p class="warning">⏱️ This code will expire in <strong>10 minutes</strong>.</p>
            <p class="warning">If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NITinder - NIT Jalandhar</p>
          </div>
        </div>
      </body>
      </html>
    `,
      textContent: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    };

    console.log(`[EMAIL] Sending OTP via Brevo API to: ${email}`);
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[EMAIL] OTP sent successfully via Brevo API:', result.body.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending OTP via Brevo API:', error.message);
    if (error.response) {
      console.error('[EMAIL] Brevo API response:', error.response.text);
    }
    console.log(`[OTP] Fallback - Code for ${email}: ${otp}`);
    return false;
  }
}
