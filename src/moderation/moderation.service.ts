import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { ModerationLog } from './models/moderation-log.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';

@Injectable()
export class ModerationService extends BaseService<ModerationLog> {
  private readonly defaultInclude = [
    {
      model: Contribution,
      attributes: ['id', 'title', 'status', 'user_id'],
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
    },
    {
      model: User,
      as: 'reviewer',
      attributes: ['id', 'username', 'full_name'],
    },
  ];

  constructor(
    @InjectModel(ModerationLog)
    private readonly moderationModel: typeof ModerationLog,
  ) {
    super(moderationModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['action', 'reason'],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }
}
