import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ModerationLog } from './models/moderation-log.model';
import { BaseService } from '../common/base.service';
@Injectable()
export class ModerationService extends BaseService<ModerationLog> {
  constructor(
    @InjectModel(ModerationLog)
    private readonly moderationModel: typeof ModerationLog,
  ) {
    super(moderationModel);
  }

  async findAll() {
    return super.findAll({ include: ['contribution', 'reviewer'] });
  }
}
