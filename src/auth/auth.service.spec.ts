import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { CooldownService } from '../common/services/cooldown.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;
  let tokenService: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-uuid-1',
    username: 'testuser',
    full_name: 'Test User',
    email: 'test@trace.ps',
    password: '$2b$10$hashedPassword',
    status: 'active',
    dataValues: {
      id: 'user-uuid-1',
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@trace.ps',
      password: '$2b$10$hashedPassword',
      status: 'active',
    },
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByIdentifier: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      getUserRoles: jest.fn(),
      update: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    tokenService = {
      createRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      verifyAndConsumeRefreshToken: jest.fn(),
    };

    const emailService = {
      sendResetPasswordEmail: jest.fn().mockResolvedValue(true),
      sendOpenCallConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };

    const cooldownService = {
      enforce: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: TokenService, useValue: tokenService },
        { provide: EmailService, useValue: emailService },
        { provide: CooldownService, useValue: cooldownService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── validateUser ──────────────────────────────────────────

  describe('validateUser', () => {
    it('should return user data (without password) for valid credentials', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@trace.ps', 'password123');

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', 'test@trace.ps');
      expect(usersService.findByIdentifier).toHaveBeenCalledWith('test@trace.ps');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@trace.ps', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found (no email leak)', async () => {
      usersService.findByIdentifier.mockRejectedValue(
        new NotFoundException('not found'),
      );

      await expect(
        service.validateUser('nonexistent@trace.ps', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended accounts', async () => {
      const suspendedUser = {
        ...mockUser,
        status: 'suspended',
        dataValues: { ...mockUser.dataValues, status: 'suspended' },
      };
      usersService.findByIdentifier.mockResolvedValue(suspendedUser as any);

      await expect(
        service.validateUser('test@trace.ps', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive accounts', async () => {
      const inactiveUser = {
        ...mockUser,
        status: 'inactive',
        dataValues: { ...mockUser.dataValues, status: 'inactive' },
      };
      usersService.findByIdentifier.mockResolvedValue(inactiveUser as any);

      await expect(
        service.validateUser('test@trace.ps', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── login ─────────────────────────────────────────────────

  describe('login', () => {
    it('should return accessToken, refreshToken, and user object', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser as any);
      usersService.getUserRoles.mockResolvedValue(['user']);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        identifier: 'test@trace.ps',
        password: 'password123',
      } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'user-uuid-1',
        username: 'testuser',
        full_name: 'Test User',
        email: 'test@trace.ps',
        roles: ['user'],
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-uuid-1', email: 'test@trace.ps', roles: ['user'] },
        { expiresIn: '1h' },
      );
      expect(tokenService.createRefreshToken).toHaveBeenCalledWith(
        'user-uuid-1',
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      usersService.findByIdentifier.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          identifier: 'test@trace.ps',
          password: 'wrong',
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── signup ────────────────────────────────────────────────

  describe('signup', () => {
    const signupDto = {
      username: 'newuser',
      email: 'new@trace.ps',
      password: 'Test@1234',
      full_name: 'New User',
    };

    const createdUser = {
      id: 'new-uuid',
      username: 'newuser',
      email: 'new@trace.ps',
    };

    it('should register a new user and return tokens (auto-login)', async () => {
      // Email check: not found → available
      usersService.findByEmail.mockRejectedValue(
        new NotFoundException('not found'),
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(createdUser as any);

      // Mock Role.findOne
      const mockRole = { id: 'role-uuid', name: 'user' };
      jest.spyOn(Role, 'findOne').mockResolvedValue(mockRole as any);
      jest.spyOn(UserRole, 'create').mockResolvedValue({} as any);

      const result = await service.signup(signupDto as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        id: 'new-uuid',
        username: 'newuser',
        email: 'new@trace.ps',
        roles: ['user'],
      });
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@trace.ps',
          password: 'hashed-password',
        }),
      );
    });

    it('should throw ConflictException if email already registered', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.signup(signupDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if default role is missing', async () => {
      usersService.findByEmail.mockRejectedValue(
        new NotFoundException('not found'),
      );
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersService.create.mockResolvedValue(createdUser as any);
      jest.spyOn(Role, 'findOne').mockResolvedValue(null);

      await expect(service.signup(signupDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── logout ────────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke tokens and return success message', async () => {
      const result = await service.logout('user-uuid-1', 'some-refresh-token');

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'user-uuid-1',
        'some-refresh-token',
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should revoke all tokens when no refreshToken provided', async () => {
      await service.logout('user-uuid-1');

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'user-uuid-1',
        undefined,
      );
    });
  });

  // ─── generateResetToken ────────────────────────────────────

  describe('generateResetToken', () => {
    it('should send reset email and return success message', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.generateResetToken('test@trace.ps');

      expect(result).toEqual({ message: 'Reset email sent' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@trace.ps',
          sub: 'user-uuid-1',
          purpose: 'password-reset',
        }),
        { expiresIn: '1h' },
      );
    });

    it('should return generic message for non-existent email (no leak)', async () => {
      usersService.findByEmail.mockRejectedValue(
        new NotFoundException('not found'),
      );

      const result = await service.generateResetToken('nonexistent@trace.ps');

      expect(result).toEqual({
        message: 'Reset email sent',
      });
    });
  });

  // ─── resetPassword ─────────────────────────────────────────

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      jwtService.verify.mockReturnValue({
        email: 'test@trace.ps',
        sub: 'user-uuid-1',
        purpose: 'password-reset',
        iat: Math.floor(Date.now() / 1000),
      });
      usersService.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      const result = await service.resetPassword(
        'valid-token',
        'NewPass@123',
        'NewPass@123',
      );

      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        password: 'new-hashed',
        password_changed_at: expect.any(Date),
      });
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'user-uuid-1',
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should reject tokens without password-reset purpose', async () => {
      jwtService.verify.mockReturnValue({
        email: 'test@trace.ps',
        sub: 'user-uuid-1',
        purpose: 'authentication', // wrong purpose
      });

      await expect(
        service.resetPassword(
          'wrong-purpose-token',
          'NewPass@123',
          'NewPass@123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired/invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.resetPassword('expired-token', 'NewPass@123', 'NewPass@123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── refreshAccessToken ────────────────────────────────────

  describe('refreshAccessToken', () => {
    it('should return new access token for valid refresh token', async () => {
      tokenService.verifyAndConsumeRefreshToken.mockResolvedValue({
        user_id: 'user-uuid-1',
      } as any);
      usersService.findOne.mockResolvedValue(mockUser as any);
      usersService.getUserRoles.mockResolvedValue(['user']);

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      tokenService.verifyAndConsumeRefreshToken.mockResolvedValue(null);

      await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when no refresh token provided', async () => {
      await expect(service.refreshAccessToken('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── changePassword ────────────────────────────────────────

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)   // current password check
        .mockResolvedValueOnce(false); // same-password check
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      const result = await service.changePassword(
        'user-uuid-1',
        'currentPass',
        'newPass@123',
        'newPass@123',
      );

      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        password: 'new-hashed',
        password_changed_at: expect.any(Date),
      });
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'user-uuid-1',
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-uuid-1', 'wrongPass', 'newPass@123', 'newPass@123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', 'pass', 'newPass', 'newPass'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getUserFromToken ──────────────────────────────────────

  describe('getUserFromToken', () => {
    it('should return user with roles (no password)', async () => {
      const userWithoutPw = { ...mockUser };
      usersService.findOne.mockResolvedValue(userWithoutPw as any);
      usersService.getUserRoles.mockResolvedValue(['user', 'editor']);

      const result = await service.getUserFromToken('user-uuid-1');

      expect(result).toHaveProperty('roles', ['user', 'editor']);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(service.getUserFromToken('bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
