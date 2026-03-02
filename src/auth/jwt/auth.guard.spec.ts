import { JwtAuthGuard } from './auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { sub: 'user-1', email: 'test@trace.ps', roles: ['user'] };

      const result = guard.handleRequest(null, user);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should rethrow error if present', () => {
      const err = new UnauthorizedException('Token expired');

      expect(() => guard.handleRequest(err, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined)).toThrow(
        UnauthorizedException,
      );
    });
  });
});