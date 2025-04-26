import nodemailer from 'nodemailer';

export async function sendPasswordResetCodeEmail(to: string, code: string) {
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
            <p>We have received a request to reset your password for the university portal.</p>
            <p>Please use the verification code below to complete the process:</p>
            <p style="font-size: 18px; font-weight: bold; color: #d32f2f;">${code}</p>
            <p>This code is valid for <strong>10 minutes</strong> for security purposes.</p>
            <p>If you did not request this action, please ignore this message.</p>
            <br />
            <p>Best regards,</p>
            <p><strong>University IT Services Department</strong></p>
          </div>
        </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
}