import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    let user: User;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      // Don't reveal whether email exists
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is suspended/inactive
    if (user.status === 'suspended') {
      throw new UnauthorizedException('Account is suspended. Contact support.');
    }
    if (user.status === 'inactive') {
      throw new UnauthorizedException('Account is deactivated.');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password, ...result } = user['dataValues'];
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const roles = await this.usersService.getUserRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = await this.tokenService.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        roles,
      },
    };
  }

  async signup(signupDto: SignupDto) {
    // Check if email already exists
    try {
      await this.usersService.findByEmail(signupDto.email);
      throw new ConflictException('Email already registered');
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof NotFoundException) {
        // Email not found — available, continue
      } else {
        // Unexpected error (DB failure, etc.) — re-throw
        throw error;
      }
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.usersService.create({
      username: signupDto.username,
      full_name: signupDto.full_name,
      email: signupDto.email,
      phone_number: signupDto.phone_number,
      password: hashedPassword,
    });

    // Assign default 'user' role
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (!defaultRole) {
      throw new BadRequestException(
        'Default role not found. Please run seeders first.',
      );
    }

    await UserRole.create({
      user_id: newUser.id,
      role_id: defaultRole.id,
      assigned_at: new Date(),
    } as any);

    // Auto-login: return tokens so user doesn't have to login again
    const roles = ['user'];
    const payload = { sub: newUser.id, email: newUser.email, roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = await this.tokenService.createRefreshToken(newUser.id);

    return {
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        roles,
      },
    };
  }

  async logout(userId: string, refreshToken?: string) {
    await this.tokenService.revokeRefreshToken(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  async generateResetToken(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      const payload = { email: user.email, sub: user.id, purpose: 'password-reset' };
      const resetToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      // In production: send email with reset link containing this token
      return { resetToken, message: 'Reset token generated' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Don't reveal whether email exists
        return { message: 'If the email exists, a reset link has been sent' };
      }
      // Re-throw unexpected errors (DB failures, JWT signing errors, etc.)
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);

      // Validate token purpose to prevent access tokens being used as reset tokens
      if (decoded.purpose !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) throw new NotFoundException('User not found');

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.id, { password: hashedPassword });

      // Revoke all refresh tokens — force re-login on all devices
      await this.tokenService.revokeRefreshToken(user.id);

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokenRecord =
      await this.tokenService.verifyAndConsumeRefreshToken(refreshToken);
    if (!tokenRecord) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.usersService.findOne(tokenRecord.user_id);
    const roles = await this.usersService.getUserRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    // Issue a new refresh token (token rotation)
    const newRefreshToken = await this.tokenService.createRefreshToken(user.id);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async getUserFromToken(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const roles = await this.usersService.getUserRoles(user.id);
    const { password, ...result } = user['dataValues'];
    return { ...result, roles };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userId, { password: hashedPassword });

    // Revoke all refresh tokens except current session
    await this.tokenService.revokeRefreshToken(userId);

    return { message: 'Password changed successfully' };
  }
}