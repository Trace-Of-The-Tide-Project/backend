import { Module, forwardRef } from '@nestjs/common';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { AuthModule } from '../auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './models/role.model';
@Module({
  imports: [forwardRef(() => AuthModule), SequelizeModule.forFeature([Role])],

  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
