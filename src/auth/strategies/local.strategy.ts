import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new LoggerService(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username
    });
  }
  async validate(email: string, password: string): Promise<any> {
    this.logger.log(
      `LocalStrategy.validate called with: ${JSON.stringify({ email, password: '***' })}`,
    );
    const admin = await this.authService.validateAdmin(email, password);
    this.logger.log(
      `LocalStrategy.validate result: ${admin ? 'Admin found' : 'Admin not found'}`,
    );
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(
      `LocalStrategy.validate returning admin: ${JSON.stringify({ id: admin.id, email: admin.email })}`,
    );
    return admin;
  }
}
