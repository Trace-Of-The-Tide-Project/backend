import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectivesService } from './collectives.service';
import { CollectivesController } from './collectives.controller';
import { Collective } from './models/collective.model';
import { CollectiveMember } from './models/collective-member.model';
import { User } from '../users/models/user.model';

@Module({
    imports: [SequelizeModule.forFeature([Collective, CollectiveMember, User])],
    providers: [CollectivesService],
    controllers: [CollectivesController],
    exports: [CollectivesService],
})
export class CollectivesModule { }
