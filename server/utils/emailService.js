import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

// Create transporter
const createTransporter = () => {
  // For development, use a test account or configure with real SMTP
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // For development, log to console instead
    return {
      sendMail: async (options) => {
        console.log('\n=== Email would be sent ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.text);
        console.log('HTML:', options.html);
        console.log('===========================\n');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
};

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (email, username, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@arcraiders.com',
    to: email,
    subject: 'Verify Your ARC Raiders Companion Account',
    text: `
Hello ${username},

Thank you for registering with ARC Raiders Companion!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you did not create this account, please ignore this email.

Best regards,
ARC Raiders Companion Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ARC Raiders Companion</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${username}!</h2>
      <p>Thank you for registering with ARC Raiders Companion!</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3498db;">${verificationUrl}</p>
      <p><strong>This link will expire in 24 hours.</strong></p>
      <p>If you did not create this account, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2025 ARC Raiders Companion. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, username) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@arcraiders.com',
    to: email,
    subject: 'Welcome to ARC Raiders Companion!',
    text: `
Hello ${username},

Your email has been verified! Welcome to ARC Raiders Companion.

You can now log in and start tracking your progress, quests, and blueprints.

Happy raiding!

Best regards,
ARC Raiders Companion Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Email Verified!</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${username}!</h2>
      <p>Your email has been successfully verified.</p>
      <p>You can now log in and start using ARC Raiders Companion to:</p>
      <ul>
        <li>Track your quest progress</li>
        <li>Manage your blueprints</li>
        <li>Monitor expedition requirements</li>
        <li>And much more!</li>
      </ul>
      <p>Happy raiding!</p>
    </div>
    <div class="footer">
      <p>© 2025 ARC Raiders Companion. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw - welcome email is not critical
    return { success: false, error: error.message };
  }
};
