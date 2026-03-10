import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Record<string, jest.Mock>;

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      generateResetToken: jest.fn(),
      resetPassword: jest.fn(),
      logout: jest.fn(),
      refreshAccessToken: jest.fn(),
      getUserFromToken: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('signup', () => {
    it('should call authService.signup with dto', async () => {
      const dto = { username: 'test', email: 'test@trace.ps', password: 'Test@1234' };
      const expected = { message: 'User registered', accessToken: 'tok', user: { id: '1' } };
      authService.signup.mockResolvedValue(expected as any);

      const result = await controller.signup(dto as any);

      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login with dto', async () => {
      const dto = { email: 'test@trace.ps', password: 'Test@1234' };
      const expected = { accessToken: 'tok', user: { id: '1' } };
      authService.login.mockResolvedValue(expected as any);

      const result = await controller.login(dto as any);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.generateResetToken', async () => {
      authService.generateResetToken.mockResolvedValue({
        resetToken: 'tok',
        message: 'Reset token generated',
      });

      const result = await controller.forgotPassword({ email: 'test@trace.ps' } as any);

      expect(authService.generateResetToken).toHaveBeenCalledWith('test@trace.ps');
      expect(result).toHaveProperty('resetToken');
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with token, newPassword, and confirmPassword', async () => {
      authService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      const result = await controller.resetPassword({
        token: 'reset-tok',
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      } as any);

      expect(authService.resetPassword).toHaveBeenCalledWith('reset-tok', 'NewPass@123', 'NewPass@123');
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout with user sub from request', async () => {
      const req = { user: { sub: 'user-uuid-1' } };
      authService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      const result = await controller.logout(req, 'refresh-tok');

      expect(authService.logout).toHaveBeenCalledWith('user-uuid-1', 'refresh-tok');
    });
  });

  describe('refreshToken', () => {
    it('should return new access token', async () => {
      authService.refreshAccessToken.mockResolvedValue({ accessToken: 'new-tok' });

      const result = await controller.refreshToken('old-refresh-tok');

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('old-refresh-tok');
      expect(result).toEqual({ accessToken: 'new-tok' });
    });
  });

  describe('me', () => {
    it('should return current user from token', async () => {
      const req = { user: { sub: 'user-uuid-1' } };
      authService.getUserFromToken.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@trace.ps',
        roles: ['user'],
      } as any);

      const result = await controller.me(req);

      expect(authService.getUserFromToken).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toHaveProperty('email', 'test@trace.ps');
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword', async () => {
      const req = { user: { sub: 'user-uuid-1' } };
      authService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const result = await controller.changePassword(req, { currentPassword: 'oldPass', newPassword: 'newPass@123' } as any);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-uuid-1',
        'oldPass',
        'newPass@123',
      );
    });
  });
});