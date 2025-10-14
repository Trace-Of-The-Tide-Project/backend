import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Donation } from './models/donation.model';
import { Partner } from '../partners/models/partner.model';
import { User } from '../users/models/user.model';

@Injectable()
export class DonationsService {
  constructor(
    @InjectModel(Donation)
    private readonly donationModel: typeof Donation,
  ) {}

  async create(data: Partial<Donation>) {
    return this.donationModel.create(data as any);
  }

  async findAll() {
    return this.donationModel.findAll({ include: [Partner, User] });
  }

  async findOne(id: string) {
    const donation = await this.donationModel.findByPk(id, { include: [Partner, User] });
    if (!donation) throw new NotFoundException(`Donation ${id} not found`);
    return donation;
  }

  async remove(id: string) {
    const deleted = await this.donationModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Donation ${id} not found`);
    return { message: `Donation ${id} deleted successfully` };
  }
}
