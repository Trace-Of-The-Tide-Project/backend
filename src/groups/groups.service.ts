import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Group } from './models/group.model';
import { GroupMember } from './models/group-member.model';
import { User } from '../users/models/user.model';

@Injectable()
export class GroupsService extends BaseService<Group> {
  private readonly defaultInclude = [
    {
      model: GroupMember,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
    },
  ];

  constructor(
    @InjectModel(Group) private readonly groupModel: typeof Group,
    @InjectModel(GroupMember) private readonly memberModel: typeof GroupMember,
  ) {
    super(groupModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['name', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  // update and remove inherited from BaseService

  async addMember(groupId: string, userId: string, role = 'member') {
    await this.findOne(groupId);

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const existing = await this.memberModel.findOne({
      where: { group_id: groupId, user_id: userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this group');
    }

    return this.memberModel.create({
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date(),
    } as any);
  }

  async removeMember(groupId: string, userId: string) {
    await this.findOne(groupId);

    const deleted = await this.memberModel.destroy({
      where: { group_id: groupId, user_id: userId },
    });
    if (!deleted) {
      throw new NotFoundException('Member not found in this group');
    }

    return { message: 'Member removed successfully' };
  }

  async getMembers(groupId: string) {
    await this.findOne(groupId);

    return this.memberModel.findAll({
      where: { group_id: groupId },
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
      order: [['joined_at', 'ASC']],
    });
  }
}
