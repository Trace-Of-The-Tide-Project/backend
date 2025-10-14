import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OpenCallsService } from './open-call.service';
import { OpenCallsController } from './open-call.controller';
import { OpenCall } from './models/open-call.model';
import { Participant } from './models/participant.model';

@Module({
  imports: [SequelizeModule.forFeature([OpenCall, Participant])],
  controllers: [OpenCallsController],
  providers: [OpenCallsService],
})
export class OpenCallsModule {}
