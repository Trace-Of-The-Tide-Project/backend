import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from 'src/common/base.service';
import { AuditTrail } from './models/audit-trail.model';
import { User } from '../users/models/user.model';

@Injectable()
export class AuditTrailsService extends BaseService<AuditTrail> {
  constructor(
    @InjectModel(AuditTrail)
    private readonly auditModel: typeof AuditTrail,
  ) {
    super(auditModel);
  }

  async findAll(query?: any) {
    return super.findAll(query, {
      include: [User],
      order: [['timestamp', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, [User] as any);
  }
}
