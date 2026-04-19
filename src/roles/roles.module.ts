import { Module, forwardRef } from '@nestjs/common';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { AuthModule } from '../auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './models/role.model';
import { UserPermission } from './models/user-permission.model';
import { PermissionsGuard } from '../auth/jwt/permissions.guard';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Role, UserPermission]),
  ],
  controllers: [RolesController],
  providers: [RolesService, PermissionsGuard],
  exports: [RolesService, PermissionsGuard, SequelizeModule],
})
export class RolesModule {}
