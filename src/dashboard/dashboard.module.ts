import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [SequelizeModule.forFeature([User, UserRole, Role])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
