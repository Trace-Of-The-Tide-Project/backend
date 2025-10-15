import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Partner } from './models/partner.model';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class PartnersService extends BaseService<Partner> {
  constructor(@InjectModel(Partner) private partnerModel: typeof Partner) {
    super(partnerModel);
  }

  // Find all مع relations + pagination + search
  async findAll(query: any) {
    return super.findAll(query, {
      searchableFields: ['name', 'email', 'phone_number'],
      include: ['donations'],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: ['donations'] });
  }

  async create(data: Partial<Partner>) {
    return super.create(data);
  }

  async remove(id: string) {
    return super.remove(id);
  }
}
