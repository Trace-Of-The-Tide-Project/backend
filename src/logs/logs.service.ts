import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Log } from './models/log.model';
import { User } from '../users/models/user.model';

@Injectable()
export class LogsService extends BaseService<Log> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name'] },
  ];

  constructor(@InjectModel(Log) private readonly logModel: typeof Log) {
    super(logModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['action', 'entity_type'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }
}
