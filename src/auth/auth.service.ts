import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ message: string; user: Partial<User> }> {
    const { email, password, ...userData } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user (not verified initially)
    const user = this.userRepository.create({
      email,
      password_hash,
      is_verified: false,
      ...userData,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate email verification token
    const verificationToken = this.jwtService.sign(
      { email: savedUser.email, sub: savedUser.id, type: 'email_verification' },
      { expiresIn: '24h' }
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(savedUser.email, verificationToken);

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = savedUser;

    return {
      message: 'Registration successful! Please check your email to verify your account.',
      user: userWithoutPassword,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string; user: Partial<User> }> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'email_verification') {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.is_verified) {
        throw new BadRequestException('Email already verified');
      }

      // Update user verification status
      user.is_verified = true;
      const updatedUser = await this.userRepository.save(user);

      const { password_hash, ...userWithoutPassword } = updatedUser;

      return {
        message: 'Email verified successfully! You can now log in.',
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Invalid or expired verification token');
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      return null;
    }

    if (!user.is_verified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (user.password_hash && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  generateAuthCookie(user: any): string {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async validateGoogleUser(googleUser: any): Promise<User> {
    const { google_id, email, first_name, avatar_url } = googleUser;

    // Check if user exists by Google ID
    let user = await this.userRepository.findOne({ where: { google_id } });

    if (user) {
      return user;
    }

    // Check if user exists by email
    user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      // Link Google account to existing user and verify email
      user.google_id = google_id;
      user.avatar_url = avatar_url;
      user.is_verified = true; // Google users are pre-verified
      return await this.userRepository.save(user);
    }

    // Create new user with Google data (pre-verified)
    const newUser = this.userRepository.create({
      google_id,
      email,
      first_name,
      avatar_url,
      is_verified: true, // Google users are pre-verified
    });

    return await this.userRepository.save(newUser);
  }
}
