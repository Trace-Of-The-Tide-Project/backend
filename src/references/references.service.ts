import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Reference } from './models/reference.model';

@Injectable()
export class ReferencesService {
    constructor(
        @InjectModel(Reference)
        private readonly referenceModel: typeof Reference,
    ) { }

    async create(data: Partial<Reference>) {
        return this.referenceModel.create(data as any);
    }

    async findAll() {
        return this.referenceModel.findAll();
    }

    async findOne(id: string) {
        const ref = await this.referenceModel.findByPk(id);
        if (!ref) throw new NotFoundException(`Reference ${id} not found`);
        return ref;
    }

    async update(id: string, data: Partial<Reference>) {
        const [affected] = await this.referenceModel.update(data, { where: { id } });
        if (!affected) throw new NotFoundException(`Reference ${id} not found`);
        return this.findOne(id);
    }

    async remove(id: string) {
        const deleted = await this.referenceModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Reference ${id} not found`);
        return { message: `Reference ${id} deleted successfully` };
    }
}
