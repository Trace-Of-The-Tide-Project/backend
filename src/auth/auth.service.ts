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
      throw new UnauthorizedException('Invalid email or password');
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
      user: { id: user.id, email: user.email, roles },
    };
  }

  async signup(signupDto: SignupDto) {
    // Check if email already exists
    try {
      await this.usersService.findByEmail(signupDto.email);
      throw new ConflictException('Email already registered');
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      // NotFoundException means email is available — continue
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.usersService.create({
      username: signupDto.username,
      full_name: signupDto.full_name,
      email: signupDto.email,
      phone_number: signupDto.phone_number,
      password: hashedPassword,
    });

    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (!defaultRole) throw new Error('Default role not found. Run seeders first.');

    await UserRole.create({
      user_id: newUser.id,
      role_id: defaultRole.id,
    } as any);

    return {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        roles: [defaultRole.name],
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
      const payload = { email: user.email, sub: user.id };
      const resetToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      return { resetToken, message: 'Reset token generated' };
    } catch {
      // Return same response whether email exists or not
      return { message: 'If the email exists, a reset token has been generated' };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findByEmail(decoded.email);

      if (!user) {
        throw new NotFoundException('User not found');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.id, { password: hashedPassword });

      await this.tokenService.revokeRefreshToken(user.id);

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenRecord =
      await this.tokenService.verifyAndConsumeRefreshToken(refreshToken);
    if (!tokenRecord) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.usersService.findOne(tokenRecord.user_id);
    const roles = await this.usersService.getUserRoles(user.id);
    const payload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    return { accessToken };
  }

  async getUserFromToken(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const roles = await this.usersService.getUserRoles(user.id);
    const { password, ...result } = user['dataValues'];
    return { ...result, roles };
  }
}