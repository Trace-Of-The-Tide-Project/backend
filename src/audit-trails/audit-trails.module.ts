import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { AuditTrail } from './models/audit-trail.model';
import { AuditTrailsService } from './audit-trails.service';
import { AuditTrailsController } from './audit-trails.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([AuditTrail])],
  providers: [AuditTrailsService],
  controllers: [AuditTrailsController],
  exports: [AuditTrailsService],
})
export class AuditTrailsModule {}
