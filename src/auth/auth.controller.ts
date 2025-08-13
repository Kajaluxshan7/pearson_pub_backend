import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Response,
  Query,
  Delete,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AdminRole } from '../admins/entities/admin.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    // Passport sets authenticated admin in req.user by convention
    const admin = req.user;

    // Validate that admin exists (should be set by LocalAuthGuard)
    if (!admin) {
      throw new UnauthorizedException('Authentication failed');
    }

    const accessToken = this.authService.generateAuthCookie(admin);

    // Set HTTP-only cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      secure: false, // Disable secure cookies for local development
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return {
      message: 'Login successful',
      admin: admin,
    };
  }
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req) {
    // Guard will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req, @Response() res: ExpressResponse) {
    const accessToken = this.authService.generateAuthCookie(req.admin);

    // Set HTTP-only cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      secure: false, // Disable secure cookies for local development
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Redirect to frontend dashboard
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirectUrl}/dashboard?auth=success`);
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.authService.getProfile(req.user.id);
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('access_token');
    return { message: 'Logout successful' };
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  @Post('invite-admin')
  async inviteAdmin(@Body() inviteAdminDto: InviteAdminDto, @Request() req) {
    return this.authService.inviteAdmin(inviteAdminDto, req.user.id);
  }

  @Post('validate-invitation')
  async validateInvitation(
    @Body() validateInvitationDto: ValidateInvitationDto,
  ) {
    return this.authService.validateInvitation(validateInvitationDto);
  }

  @Post('setup-password')
  async setupPassword(@Body() setupPasswordDto: SetupPasswordDto) {
    try {
      return await this.authService.setupPassword(setupPasswordDto);
    } catch (error: unknown) {
      // Log error details for debugging
      if (typeof error === 'object' && error !== null) {
        console.error('[setup-password] Error:', {
          message: (error as { message?: string }).message,
          name: (error as { name?: string }).name,
          stack: (error as { stack?: string }).stack,
          status: (error as { status?: number }).status,
          response: (error as { response?: unknown }).response,
        });
      } else {
        console.error('[setup-password] Error:', error);
      }
      // Return error message and status code to frontend
      throw error;
    }
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  @Delete('admin/:id')
  async deleteAdmin(@Param('id') id: string, @Request() req) {
    return this.authService.deleteAdmin(id, req.user);
  }
}
