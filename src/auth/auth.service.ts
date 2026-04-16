import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
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
import { EmailService } from '../email/email.service';
import { CooldownService } from '../common/services/cooldown.service';
import { validateEmailDomain } from '../common/utils/email-validator';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
    private emailService: EmailService,
    private cooldownService: CooldownService,
  ) {}

  async checkEmail(email: string) {
    // 1. Validate domain (MX records + disposable check)
    const domainCheck = await validateEmailDomain(email);
    if (!domainCheck.valid) {
      return {
        available: false,
        valid: false,
        reason: domainCheck.reason,
        message: domainCheck.message,
      };
    }

    // 2. Check if already registered
    try {
      await this.usersService.findByEmail(email);
      return {
        available: false,
        valid: true,
        reason: 'already_registered',
        message: 'This email is already registered',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          available: true,
          valid: true,
          message: 'Email is available',
        };
      }
      throw error;
    }
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
    let user: User;
    try {
      user = await this.usersService.findByIdentifier(identifier);
    } catch {
      // Don't reveal whether user exists
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('Invalid credentials');
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
    // Validate email domain (MX records + disposable check)
    const domainCheck = await validateEmailDomain(signupDto.email);
    if (!domainCheck.valid) {
      throw new BadRequestException(domainCheck.message);
    }

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

    // Send verification email
    const verifyPayload = {
      sub: newUser.id,
      email: newUser.email,
      purpose: 'email-verification',
    };
    const verifyToken = this.jwtService.sign(verifyPayload, {
      expiresIn: '24h',
    });
    const emailSent = await this.emailService.sendVerificationEmail(
      newUser.email,
      newUser.username,
      verifyToken,
    );
    if (!emailSent) {
      // User is created but email failed — let them retry via resend
      console.warn(`Verification email failed for ${newUser.email}`);
    }

    // Auto-login: return tokens so user doesn't have to login again
    const roles = ['user'];
    const payload = { sub: newUser.id, email: newUser.email, roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = await this.tokenService.createRefreshToken(newUser.id);

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        email_verified: false,
        roles,
      },
    };
  }

  async verifyEmail(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      if (decoded.purpose !== 'email-verification') {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.usersService.findOne(decoded.sub);
      if (!user) throw new NotFoundException('User not found');

      if (user.email_verified) {
        return { message: 'Email is already verified' };
      }

      await this.usersService.update(user.id, { email_verified: true });
      return { message: 'Email verified successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.email_verified) {
      throw new BadRequestException('Email is already verified');
    }

    // Rate limit: 60 seconds between verification email resends
    await this.cooldownService.enforce('verification', userId, 60);

    const verifyPayload = {
      sub: user.id,
      email: user.email,
      purpose: 'email-verification',
    };
    const verifyToken = this.jwtService.sign(verifyPayload, {
      expiresIn: '24h',
    });

    const sent = await this.emailService.sendVerificationEmail(
      user.email,
      user.username,
      verifyToken,
    );
    if (!sent) {
      await this.cooldownService.clear('verification', userId);
      throw new HttpException(
        'Failed to send verification email. Please try again.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { message: 'Verification email sent' };
  }

  async logout(userId: string, refreshToken?: string) {
    await this.tokenService.revokeRefreshToken(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * Generate a password reset token and send an email with the reset link.
   * Rate limited to 1 request per 60 seconds per email.
   */
  async generateResetToken(email: string) {
    // Rate limiting: max 1 request per 60 seconds per email (Redis-backed when available)
    await this.cooldownService.enforce('reset', email, 60);

    try {
      const user = await this.usersService.findByEmail(email);
      const payload = {
        email: user.email,
        sub: user.id,
        purpose: 'password-reset',
      };
      const resetToken = this.jwtService.sign(payload, { expiresIn: '1h' });

      const sent = await this.emailService.sendResetPasswordEmail(
        user.email,
        resetToken,
      );
      if (!sent) {
        await this.cooldownService.clear('reset', email);
        throw new HttpException(
          'Failed to send reset email. Please try again.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return { message: 'Reset email sent' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Don't reveal whether email exists — still return success message
        return { message: 'Reset email sent' };
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Resend reset password email with 48-second cooldown.
   */
  async resendResetEmail(email: string) {
    // Use same 60s cooldown as generateResetToken to prevent bypass (Redis-backed when available)
    await this.cooldownService.enforce('reset', email, 60);

    try {
      const user = await this.usersService.findByEmail(email);
      const payload = {
        email: user.email,
        sub: user.id,
        purpose: 'password-reset',
      };
      const resetToken = this.jwtService.sign(payload, { expiresIn: '1h' });

      const sent = await this.emailService.sendResetPasswordEmail(
        user.email,
        resetToken,
      );
      if (!sent) {
        await this.cooldownService.clear('reset', email);
        throw new HttpException(
          'Failed to send reset email. Please try again.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return { message: 'Reset email resent', cooldown: 60 };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { message: 'Reset email resent', cooldown: 60 };
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      const decoded = this.jwtService.verify(token);

      // Validate token purpose to prevent access tokens being used as reset tokens
      if (decoded.purpose !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Use user ID (not email) for robust lookup even if email changed
      const user = await this.usersService.findOne(decoded.sub);
      if (!user) throw new NotFoundException('User not found');

      // Enforce single-use: reject if password was changed after token was issued
      if (
        user.password_changed_at &&
        decoded.iat < Math.floor(user.password_changed_at.getTime() / 1000)
      ) {
        throw new BadRequestException('This reset link has already been used');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.id, {
        password: hashedPassword,
        password_changed_at: new Date(),
      });

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

  async refreshAccessToken(refreshToken: string, accessToken?: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Scope the DB query by userId to prevent full-table bcrypt DoS
    let userId: string | undefined;
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken);
        if (decoded?.sub) userId = decoded.sub;
      } catch {
        // Ignore decode failures — fall through to unscoped lookup
      }
    }

    const tokenRecord = await this.tokenService.verifyAndConsumeRefreshToken(
      refreshToken,
      userId,
    );
    if (!tokenRecord) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.usersService.findOne(tokenRecord.user_id);
    const roles = await this.usersService.getUserRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };

    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    // Issue a new refresh token (token rotation)
    const newRefreshToken = await this.tokenService.createRefreshToken(user.id);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
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
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findOneWithPassword(userId);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent reusing the same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userId, {
      password: hashedPassword,
      password_changed_at: new Date(),
    });

    // Revoke all refresh tokens — force re-login on all devices
    await this.tokenService.revokeRefreshToken(userId);

    return { message: 'Password changed successfully' };
  }
}
