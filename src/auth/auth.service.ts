import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Admin, AdminRole } from '../admins/entities/admin.entity';
import { AdminInvitation } from './entities/admin-invitation.entity';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(AdminInvitation)
    private invitationRepository: Repository<AdminInvitation>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}
  async verifyEmail(
    token: string,
  ): Promise<{ message: string; admin: Partial<Admin> }> {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'email_verification') {
        throw new BadRequestException('Invalid verification token');
      }

      const admin = await this.adminRepository.findOne({
        where: { id: payload.sub },
      });
      if (!admin) {
        throw new BadRequestException('Admin not found');
      }

      if (admin.is_verified) {
        throw new BadRequestException('Email already verified');
      }

      // Update admin verification status
      admin.is_verified = true;
      const updatedAdmin = await this.adminRepository.save(admin);

      const { password_hash, ...adminWithoutPassword } = updatedAdmin;

      return {
        message: 'Email verified successfully! You can now log in.',
        admin: adminWithoutPassword,
      };
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new BadRequestException('Invalid or expired verification token');
      }
      throw error;
    }
  }
  async validateAdmin(email: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      return null;
    }

    if (!admin.is_verified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (!admin.is_active) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    if (
      admin.password_hash &&
      (await bcrypt.compare(password, admin.password_hash))
    ) {
      const { password_hash, ...result } = admin;
      return result;
    }
    return null;
  }
  generateAuthCookie(admin: any): string {
    if (!admin || !admin.email || !admin.id) {
      throw new Error('Invalid admin object provided for token generation');
    }

    const payload = {
      email: admin.email,
      sub: admin.id,
      role: admin.role,
    };
    return this.jwtService.sign(payload);
  }

  async validateGoogleAdmin(googleAdmin: any): Promise<Admin> {
    const { google_id, email, first_name, avatar_url } = googleAdmin;

    // Check if admin exists by Google ID
    let admin = await this.adminRepository.findOne({ where: { google_id } });

    if (admin) {
      return admin;
    }

    // Check if admin exists by email
    admin = await this.adminRepository.findOne({ where: { email } });

    if (admin) {
      // Link Google account to existing admin and verify email
      admin.google_id = google_id;
      admin.avatar_url = avatar_url;
      admin.is_verified = true; // Google admins are pre-verified
      return await this.adminRepository.save(admin);
    }

    // Create new admin with Google data (pre-verified)
    const newAdmin = this.adminRepository.create({
      google_id,
      email,
      first_name,
      avatar_url,
      is_verified: true, // Google admins are pre-verified
    });

    return await this.adminRepository.save(newAdmin);
  }
  async inviteAdmin(
    inviteAdminDto: InviteAdminDto,
    invitedBy: string,
  ): Promise<{ message: string }> {
    const { email, role = AdminRole.ADMIN } = inviteAdminDto;

    // Check if admin already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { email },
    });
    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationRepository.findOne({
      where: { email, is_used: false },
    });

    // If there's an unused invitation, we can resend it or create a new one
    if (existingInvitation) {
      // Delete the old invitation to create a new one
      await this.invitationRepository.remove(existingInvitation);
    }

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    // Set expiry time (24 hours from now for better user experience)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create invitation record
    const invitation = this.invitationRepository.create({
      email,
      token_hash: tokenHash,
      role,
      expires_at: expiresAt,
      invited_by: invitedBy,
    });

    await this.invitationRepository.save(invitation);

    // Send invitation email
    await this.emailService.sendAdminInvitationEmail(email, token, role);

    return {
      message: existingInvitation
        ? 'Admin invitation resent successfully'
        : 'Admin invitation sent successfully',
    };
  }
  async validateInvitation(
    validateInvitationDto: ValidateInvitationDto,
  ): Promise<{
    message: string;
    invitation: { email: string; role: AdminRole };
  }> {
    const { token } = validateInvitationDto;

    // Find all non-used invitations and check token
    const invitations = await this.invitationRepository.find({
      where: { is_used: false },
    });

    let validInvitation: AdminInvitation | null = null;
    for (const invitation of invitations) {
      if (await bcrypt.compare(token, invitation.token_hash)) {
        validInvitation = invitation;
        break;
      }
    }

    if (!validInvitation) {
      throw new BadRequestException('Invalid invitation token');
    }

    if (validInvitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation token has expired');
    }

    return {
      message: 'Invitation token is valid',
      invitation: {
        email: validInvitation.email,
        role: validInvitation.role,
      },
    };
  }

  async setupPassword(setupPasswordDto: SetupPasswordDto): Promise<{
    message: string;
    admin: Partial<Admin>;
  }> {
    const { token, password, ...adminData } = setupPasswordDto;

    // Validate token first
    const validation = await this.validateInvitation({ token });
    const { email, role } = validation.invitation;

    // Check if admin already exists (shouldn't happen but extra safety)
    const existingAdmin = await this.adminRepository.findOne({
      where: { email },
    });
    if (existingAdmin) {
      throw new ConflictException('Admin account already exists');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create admin account (pre-verified since invited by superadmin)
    const admin = this.adminRepository.create({
      email,
      password_hash,
      role,
      is_verified: true,
      is_active: true,
      ...adminData,
    });

    const savedAdmin = await this.adminRepository.save(admin);

    // Mark invitation as used
    await this.invitationRepository.update(
      { email, is_used: false },
      { is_used: true },
    );

    // Return admin without password
    const { password_hash: _, ...adminWithoutPassword } = savedAdmin;

    return {
      message: 'Admin account created successfully! You can now log in.',
      admin: adminWithoutPassword,
    };
  }

  async deleteAdmin(
    adminId: string,
    requestingAdmin: Admin,
  ): Promise<{ message: string }> {
    // Get the admin to be deleted
    const adminToDelete = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!adminToDelete) {
      throw new BadRequestException('Admin not found');
    }

    // Prevent deleting superadmins (only superadmins can delete other superadmins)
    if (
      adminToDelete.role === AdminRole.SUPERADMIN &&
      requestingAdmin.role !== AdminRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'Only superadmins can delete other superadmins',
      );
    }

    // Prevent self-deletion
    if (adminToDelete.id === requestingAdmin.id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Soft delete by deactivating
    adminToDelete.is_active = false;
    await this.adminRepository.save(adminToDelete);

    return {
      message: 'Admin account deactivated successfully',
    };
  }
}
