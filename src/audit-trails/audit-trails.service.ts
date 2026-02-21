import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { AuditTrail } from './models/audit-trail.model';
import { User } from '../users/models/user.model';

@Injectable()
export class AuditTrailsService extends BaseService<AuditTrail> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name'] },
  ];

  constructor(
    @InjectModel(AuditTrail)
    private readonly auditModel: typeof AuditTrail,
  ) {
    super(auditModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['action', 'entity_type'],
      order: [['timestamp', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }
}