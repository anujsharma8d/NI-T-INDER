import nodemailer from 'nodemailer';

// Create transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // For development, use ethereal email (fake SMTP)
  // For production, use real SMTP credentials from environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  } else {
    // Development mode - log to console instead of sending
    console.log('[EMAIL] No SMTP credentials found. Running in development mode.');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('[EMAIL] Would send email:');
        console.log('  To:', mailOptions.to);
        console.log('  Subject:', mailOptions.subject);
        console.log('  Text:', mailOptions.text);
        console.log('  HTML:', mailOptions.html);
        return { messageId: 'dev-mode-' + Date.now() };
      }
    };
  }

  return transporter;
}

export async function sendOTPEmail(email, otp) {
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"NITinder" <noreply@nitinder.com>',
    to: email,
    subject: 'Your NITinder Verification Code',
    text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
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
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] OTP sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending OTP:', error);
    return false;
  }
}
