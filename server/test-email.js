import nodemailer from 'nodemailer';
import 'dotenv/config';

async function testEmail() {
  console.log('Testing Brevo email configuration...');
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Set ✓' : 'Not set ✗');
  console.log('BREVO_USER:', process.env.BREVO_USER);
  console.log('SMTP_FROM:', process.env.SMTP_FROM);

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_API_KEY,
    },
  });

  try {
    console.log('\nVerifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully!');

    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'anujsharma8d@gmail.com', // Send to your Gmail
      subject: 'Test Email from NITinder',
      text: 'This is a test email to verify Brevo SMTP is working correctly.',
      html: '<h1>Test Email</h1><p>If you receive this, Brevo SMTP is working! 🎉</p>',
    });

    console.log('✓ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\nCheck your email inbox (anujsharma8d@gmail.com)');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
