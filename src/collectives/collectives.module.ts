import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectivesService } from './collectives.service';
import { CollectivesController } from './collectives.controller';
import { Collective } from './models/collective.model';
import { CollectiveMember } from './models/collective-member.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Collective, CollectiveMember, User]),
  ],
  providers: [CollectivesService],
  controllers: [CollectivesController],
  exports: [CollectivesService],
})
export class CollectivesModule {}
