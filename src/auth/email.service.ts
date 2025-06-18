import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { AdminRole } from '../admins/entities/admin.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: `"${this.configService.get<string>('SMTP_FROM_NAME') || 'The Pearson Pub'}" <${this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Welcome to The Pearson Pub!</h1>
            <p style="color: #666; font-size: 16px;">Please verify your email address to complete your registration.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">
              Click the button below to verify your email address:
            </p>
            
            <a href="${verificationUrl}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Verify Email Address
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #007bff; font-size: 14px;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }
  async sendAdminInvitationEmail(email: string, token: string, role: AdminRole): Promise<void> {
    const invitationUrl = `${this.configService.get<string>('FRONTEND_URL') || 'https://localhost:3000'}/admin/setup-password?token=${token}`;
    
    // Read the HTML template
    const templatePath = path.join(__dirname, 'templates', 'admin-invitation-email.html');
    let htmlTemplate = '';
    
    try {
      htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      // Fallback to inline HTML if template file is not found
      htmlTemplate = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">You've been invited to join The Pearson Pub!</h1>
            <p style="color: #666; font-size: 16px;">You have been invited to join as an ${role} administrator.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">
              Click the button below to set up your admin account:
            </p>
            
            <a href="${invitationUrl}" 
               style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Set Up Admin Account
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #28a745; font-size: 14px;">
              ${invitationUrl}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
            <p><strong>Important:</strong> This invitation link will expire in 1 hour for security reasons.</p>
            <p>If you didn't expect this invitation, please ignore this email or contact us.</p>
          </div>
        </div>
      `;
    }

    // Simple template replacement (you could use a proper template engine like Handlebars)
    const html = htmlTemplate
      .replace(/{{invitationUrl}}/g, invitationUrl)
      .replace(/{{role}}/g, role)
      .replace(/{{#if isSuperAdmin}}/g, role === AdminRole.SUPERADMIN ? '' : '<!--')
      .replace(/{{else}}/g, role === AdminRole.SUPERADMIN ? '<!--' : '')
      .replace(/{{\/if}}/g, '-->')
      .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments

    const mailOptions = {
      from: `"${this.configService.get<string>('SMTP_FROM_NAME') || 'The Pearson Pub'}" <${this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `Admin Invitation - The Pearson Pub (${role})`,
      html: html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending admin invitation email:', error);
      throw new Error('Failed to send admin invitation email');
    }
  }
}
