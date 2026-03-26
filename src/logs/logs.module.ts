import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Log } from './models/log.model';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Log]),
    forwardRef(() => AuthModule),
  ],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [SequelizeModule, LogsService],
})
export class LogsModule {}
