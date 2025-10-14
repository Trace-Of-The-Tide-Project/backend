import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tag } from './models/tag.model';

@Injectable()
export class TagsService {
    constructor(
        @InjectModel(Tag)
        private readonly tagModel: typeof Tag,
    ) { }

    async create(data: Partial<Tag>) {
        return this.tagModel.create(data as any);
    }

    async findAll() {
        return this.tagModel.findAll();
    }

    async findOne(id: string) {
        const tag = await this.tagModel.findByPk(id);
        if (!tag) throw new NotFoundException(`Tag ${id} not found`);
        return tag;
    }

    async update(id: string, data: Partial<Tag>) {
        const [affected] = await this.tagModel.update(data, { where: { id } });
        if (!affected) throw new NotFoundException(`Tag ${id} not found`);
        return this.findOne(id);
    }

    async remove(id: string) {
        const deleted = await this.tagModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Tag ${id} not found`);
        return { message: `Tag ${id} deleted successfully` };
    }
}
