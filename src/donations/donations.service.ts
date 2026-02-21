import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Donation } from './models/donation.model';
import { Partner } from '../partners/models/partner.model';
import { User } from '../users/models/user.model';

@Injectable()
export class DonationsService extends BaseService<Donation> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
    Partner,
  ];

  constructor(
    @InjectModel(Donation)
    private readonly donationModel: typeof Donation,
  ) {
    super(donationModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['type', 'status'],
      order: [['date', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async create(data: Partial<Donation>) {
    return this.model.create({
      date: new Date(),
      status: 'pending',
      ...data,
    } as any);
  }

}