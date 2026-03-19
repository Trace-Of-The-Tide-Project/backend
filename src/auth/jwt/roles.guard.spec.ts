import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { get: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRoles: string[]): ExecutionContext {
    return {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'user-1', roles: userRoles },
        }),
      }),
    } as any;
  }

  it('should allow access when no roles are required', () => {
    reflector.get.mockReturnValue(undefined);
    const context = createMockContext(['user']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.get.mockReturnValue(['admin']);
    const context = createMockContext(['admin', 'user']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    reflector.get.mockReturnValue(['admin']);
    const context = createMockContext(['user']);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow if user has any one of multiple required roles', () => {
    reflector.get.mockReturnValue(['admin', 'editor']);
    const context = createMockContext(['editor']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when user has no roles', () => {
    reflector.get.mockReturnValue(['admin']);
    const context = createMockContext([]);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should handle undefined user roles gracefully', () => {
    reflector.get.mockReturnValue(['admin']);
    const context = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { sub: 'user-1' } }), // no roles property
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(false);
  });
});
