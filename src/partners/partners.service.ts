import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Partner } from './models/partner.model';
import { Donation } from '../donations/models/donation.model';

@Injectable()
export class PartnersService extends BaseService<Partner> {
  private readonly defaultInclude = [
    { model: Donation, attributes: ['id', 'amount', 'type', 'status', 'date'] },
  ];

  constructor(@InjectModel(Partner) private partnerModel: typeof Partner) {
    super(partnerModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['name', 'email', 'phone_number'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }
}
