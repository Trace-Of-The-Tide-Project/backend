import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';
import { UserPermission } from '../../roles/models/user-permission.model';
import { PERMISSION_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(UserPermission)
    private readonly userPermissionModel: typeof UserPermission,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // No permission required on this handler — pass through
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // Check for a user-specific override first
    const override = await this.userPermissionModel.findOne({
      where: { user_id: user.sub, permission: requiredPermission },
    });

    if (override) {
      // Explicit grant or revoke — this takes precedence over role
      return override.granted;
    }

    // No override — fall back to admin role check (admins can do anything)
    return user.roles?.includes('admin') ?? false;
  }
}
