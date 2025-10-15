import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Collective } from './models/collective.model';
import { CollectiveMember } from './models/collective-member.model';
import { User } from '../users/models/user.model';

@Injectable()
export class CollectivesService extends BaseService<Collective> {
  constructor(
    @InjectModel(Collective)
    private readonly collectiveModel: typeof Collective,

    @InjectModel(CollectiveMember)
    private readonly memberModel: typeof CollectiveMember,
  ) {
    super(collectiveModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: [{ model: CollectiveMember, include: [User] }],
      searchableFields: ['name', 'description'],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, {
      include: [{ model: CollectiveMember, include: [User] }],
    });
  }

  async addMember(collectiveId: string, userId: string, role = 'member') {
    return this.memberModel.create({
      collective_id: collectiveId,
      user_id: userId,
      role,
      joined_at: new Date(),
    } as any);
  }
}
