import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from './models/group.model';
import { GroupMember } from './models/group-member.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Group, GroupMember, User])],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
