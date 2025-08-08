import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username
    });
  }
  async validate(email: string, password: string): Promise<any> {
    console.log('LocalStrategy.validate called with:', {
      email,
      password: '***',
    });
    const admin = await this.authService.validateAdmin(email, password);
    console.log(
      'LocalStrategy.validate result:',
      admin ? 'Admin found' : 'Admin not found',
    );
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('LocalStrategy.validate returning admin:', {
      id: admin.id,
      email: admin.email,
    });
    return admin;
  }
}
