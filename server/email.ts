/**
 * Let's Estimate - Email Delivery Service
 * Handles outbound transactional emails for email verification, password resets,
 * and subscription payment approvals using Nodemailer.
 */

import nodemailer from 'nodemailer';

interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

// Build transport dynamically based on environment configuration
function createTransporter() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.MAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  // Check if Gmail credentials are provided directly
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  return null;
}

const FROM_ADDRESS = process.env.SMTP_FROM || process.env.MAIL_FROM || '"Let\'s Estimate QS Platform" <support@letsestimate.com>';

/**
 * Dispatch verification 6-digit code email
 */
export async function sendVerificationEmail(
  toEmail: string,
  fullName: string,
  code: string
): Promise<SendMailResult> {
  console.log(`[EMAIL DISPATCH] >>> Verification code for ${toEmail} (${fullName}): [ ${code} ] <<<`);

  const transporter = createTransporter();
  if (!transporter) {
    console.log('[EMAIL DISPATCH] No SMTP credentials configured. Verification code logged to console and provided in API response.');
    return {
      success: true,
      code,
      messageId: 'dev-mode-' + Date.now()
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify your Let's Estimate Account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #064e3b; padding: 28px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .code-box { background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #047857; letter-spacing: 1px; margin-bottom: 8px; }
        .code-number { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #064e3b; font-family: monospace; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Let's Estimate</h1>
          <p>NIQS & BESMM4 Accredited Cost Engineering Platform</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${fullName || 'Quantity Surveyor'},</div>
          <p class="text">
            Thank you for creating your account on <strong>Let's Estimate</strong>. To secure your account and verify your email address, please use the following 6-digit verification code:
          </p>
          <div class="code-box">
            <div class="code-title">Your 6-Digit Verification Code</div>
            <div class="code-number">${code}</div>
          </div>
          <p class="text">
            This code will remain valid for 24 hours. If you did not create an account on Let's Estimate, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Let's Estimate. Lead QS Isaac Emmanuel, MYQSF. Port Harcourt & Lagos, Nigeria.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `[${code}] Verify your Let's Estimate Account`,
      text: `Hello ${fullName},\n\nYour Let's Estimate verification code is: ${code}\n\nEnter this 6-digit code on the verification screen to activate your account.`,
      html: htmlContent
    });

    console.log(`[EMAIL DISPATCH] Email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, code };
  } catch (error: any) {
    console.error(`[EMAIL DISPATCH] Failed to send email via SMTP to ${toEmail}:`, error.message);
    return { success: false, error: error.message, code };
  }
}

/**
 * Dispatch password reset email
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  fullName: string,
  code: string
): Promise<SendMailResult> {
  console.log(`[EMAIL DISPATCH] >>> Password Reset code for ${toEmail}: [ ${code} ] <<<`);
  const transporter = createTransporter();
  if (!transporter) {
    return { success: true, code, messageId: 'dev-reset-' + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `[${code}] Reset Your Let's Estimate Password`,
      text: `Hello ${fullName},\n\nYour password reset code is: ${code}\n\nUse this code to set a new password for your account.`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#064e3b;">Reset Your Password</h2>
          <p>Hello ${fullName},</p>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background:#f1f5f9;padding:16px;text-align:center;font-size:28px;font-weight:bold;letter-spacing:6px;border-radius:8px;margin:20px 0;">
            ${code}
          </div>
          <p style="font-size:12px;color:#64748b;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      `
    });
    return { success: true, messageId: info.messageId, code };
  } catch (err: any) {
    return { success: false, error: err.message, code };
  }
}
