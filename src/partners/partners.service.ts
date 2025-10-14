import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Partner } from './models/partner.model';

@Injectable()
export class PartnersService {
    constructor(
        @InjectModel(Partner)
        private readonly partnerModel: typeof Partner,
    ) { }

    async create(data: Partial<Partner>) {
        return this.partnerModel.create(data as any);
    }

    async findAll() {
        return this.partnerModel.findAll({ include: ['donations'] });
    }

    async findOne(id: string) {
        const partner = await this.partnerModel.findByPk(id, { include: ['donations'] });
        if (!partner) throw new NotFoundException(`Partner ${id} not found`);
        return partner;
    }

    async remove(id: string) {
        const deleted = await this.partnerModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Partner ${id} not found`);
        return { message: `Partner ${id} deleted successfully` };
    }
}
