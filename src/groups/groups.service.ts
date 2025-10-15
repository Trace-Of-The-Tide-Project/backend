import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Group } from './models/group.model';
import { GroupMember } from './models/group-member.model';
import { User } from '../users/models/user.model';

@Injectable()
export class GroupsService extends BaseService<Group> {
  constructor(
    @InjectModel(Group) private readonly groupModel: typeof Group,
    @InjectModel(GroupMember) private readonly memberModel: typeof GroupMember,
  ) {
    super(groupModel);
  }

  async findAll() {
    return super.findAll([{ model: GroupMember, include: [User] }]);
  }

  async findOne(id: string) {
    const group = await super.findOne(id, [
      { model: GroupMember, include: [User] },
    ] as any);
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  async update(id: string, data: any) {
    const [affected] = await this.groupModel.update(data, { where: { id } });
    if (!affected) throw new NotFoundException(`Group ${id} not found`);
    return this.findOne(id);
  }

  async addMember(groupId: string, userId: string, role = 'member') {
    return this.memberModel.create({
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date(),
    } as any);
  }
}
