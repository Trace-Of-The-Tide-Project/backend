import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Donation } from './models/donation.model';
import { Partner } from '../partners/models/partner.model';
import { User } from '../users/models/user.model';

@Injectable()
export class DonationsService extends BaseService<Donation> {
  constructor(
    @InjectModel(Donation)
    private readonly donationModel: typeof Donation,
  ) {
    super(donationModel);
  }

  async findAll() {
    return super.findAll([Partner, User]);
  }

  async findOne(id: string) {
    const donation = await super.findOne(id, [Partner, User] as any);
    if (!donation) throw new NotFoundException(`Donation ${id} not found`);
    return donation;
  }

  async remove(id: string) {
    const deleted = await this.donationModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Donation ${id} not found`);
    return { message: `Donation ${id} deleted successfully` };
  }
}
