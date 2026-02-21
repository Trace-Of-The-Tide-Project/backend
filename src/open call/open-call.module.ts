import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { OpenCallsService } from './open-call.service';
import { OpenCallsController } from './open-call.controller';
import { OpenCall } from './models/open-call.model';
import { Participant } from './models/participant.model';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([OpenCall, Participant]),
  ],
  controllers: [OpenCallsController],
  providers: [OpenCallsService],
  exports: [OpenCallsService],
})
export class OpenCallsModule {}