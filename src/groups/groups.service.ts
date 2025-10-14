import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Group } from './models/group.model';
import { GroupMember } from './models/group-member.model';
import { User } from '../users/models/user.model';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group) private readonly groupModel: typeof Group,
    @InjectModel(GroupMember) private readonly memberModel: typeof GroupMember,
  ) {}

  async create(data: Partial<Group>) {
    return this.groupModel.create(data as any);
  }

  async findAll() {
    return this.groupModel.findAll({
      include: [{ model: GroupMember, include: [User] }],
    });
  }

  async findOne(id: string) {
    const group = await this.groupModel.findByPk(id, {
      include: [{ model: GroupMember, include: [User] }],
    });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  async update(id: string, data: any) {
    const [affected] = await this.groupModel.update(data, { where: { id } });
    if (!affected) throw new NotFoundException(`Group ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleted = await this.groupModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Group ${id} not found`);
    return { message: `Group ${id} deleted successfully` };
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
