import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([User, UserRole, Role]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
