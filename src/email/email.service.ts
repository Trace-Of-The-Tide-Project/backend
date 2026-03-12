import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    this.logger.log(`SMTP_USER loaded: ${smtpUser ? smtpUser : 'MISSING'}`);
    this.logger.log(`SMTP_PASS loaded: ${smtpPass ? '***set***' : 'MISSING'}`);

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  private get fromAddress(): string {
    return this.configService.get<string>(
      'SMTP_FROM',
      'noreply@traceofthetides.com',
    );
  }

  private get frontendUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
  }

  async sendResetPasswordEmail(
    email: string,
    token: string,
  ): Promise<boolean> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Trace of the Tides" <${this.fromAddress}>`,
        to: email,
        subject: 'Reset Your Password — Trace of the Tides',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}"
                 style="background-color: #1a1a2e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this URL into your browser:<br/>
              <a href="${resetLink}">${resetLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">Trace of the Tides — Palestinian Heritage Storytelling Platform</p>
          </div>
        `,
      });
      this.logger.log(`Reset password email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}`, error);
      return false;
    }
  }

  async sendOpenCallConfirmationEmail(
    email: string,
    firstName: string,
    openCallTitle: string,
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"Trace of the Tides" <${this.fromAddress}>`,
        to: email,
        subject: `You've joined: ${openCallTitle} — Trace of the Tides`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome, ${firstName}!</h2>
            <p>Thank you for joining the open call: <strong>${openCallTitle}</strong>.</p>
            <p>Your participation has been registered. We'll review your submission and keep you updated on next steps.</p>
            <p style="margin-top: 30px;">
              <a href="${this.frontendUrl}"
                 style="background-color: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Visit Trace of the Tides
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">Trace of the Tides — Palestinian Heritage Storytelling Platform</p>
          </div>
        `,
      });
      this.logger.log(`Open call confirmation sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send open call confirmation to ${email}`, error);
      return false;
    }
  }
}
