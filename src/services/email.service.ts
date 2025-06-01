import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export async function sendPasswordResetCodeEmail(to: string, code: string) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials are not configured');
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: '"University Portal" <no-reply@portal.usv.ro>',
      to,
      subject: 'Your Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #004080;">Password Reset Request</h2>
              <p>Dear Student,</p>
              <p>We have received a request to reset your password for the uniSync Services.</p>
              <p>Please use the verification code below to complete the process:</p>
              <p style="font-size: 18px; font-weight: bold; color: #d32f2f;">${code}</p>
              <p>This code will expire in 15 minutes (UTC: ${new Date(Date.now() + 15 * 60 * 1000).toISOString()}).</p>
              <p>If you did not request this action, please ignore this message.</p>
              <br />
              <p>Best regards,</p>
              <p><strong>uniSync Services</strong></p>
            </div>
          </body>
        </html>
      `
    };

    logger.info('Sending password reset email to:', { to });
    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent successfully');
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}