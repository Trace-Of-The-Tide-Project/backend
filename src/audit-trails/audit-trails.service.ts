import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditTrail } from './models/audit-trail.model';
import { User } from '../users/models/user.model';

@Injectable()
export class AuditTrailsService {
  constructor(@InjectModel(AuditTrail) private readonly auditModel: typeof AuditTrail) {}

  async create(data: Partial<AuditTrail>) {
    return this.auditModel.create(data as any);
  }

  async findAll() {
    return this.auditModel.findAll({ include: [User], order: [['timestamp', 'DESC']] });
  }

  async findOne(id: string) {
    const audit = await this.auditModel.findByPk(id, { include: [User] });
    if (!audit) throw new NotFoundException(`Audit ${id} not found`);
    return audit;
  }

  async remove(id: string) {
    const deleted = await this.auditModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Audit ${id} not found`);
    return { message: `Audit ${id} deleted successfully` };
  }
}
