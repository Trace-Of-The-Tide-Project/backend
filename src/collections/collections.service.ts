import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Collection } from './models/collection.model';

@Injectable()
export class CollectionsService {
    constructor(
        @InjectModel(Collection) private collectionModel: typeof Collection,
    ) { }

    async create(data: Partial<Collection>) {
        return this.collectionModel.create(data as any);
    }

    async findAll() {
        return this.collectionModel.findAll();
    }

    async findOne(id: string) {
        const collection = await this.collectionModel.findByPk(id, {
            include: ['collectionContributions'],
        });
        if (!collection) {
            throw new NotFoundException(`Collection with ID ${id} not found`);
        }
        return collection;
    }

    async update(id: string, data: Partial<Collection>) {
        const [affected] = await this.collectionModel.update(data, { where: { id } });
        if (!affected) throw new NotFoundException(`Collection with ID ${id} not found`);
        return this.findOne(id);
    }

    async remove(id: string) {
        const deleted = await this.collectionModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Collection with ID ${id} not found`);
        return { message: 'Collection deleted successfully' };
    }
}
