import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Contribution } from './models/contribution.model';
import { ContributionType } from './models/contribution-type.model';
import { CollectionContribution } from '../collections/models/collection-contribution.model';
import { File } from '../files/models/file.model';
import { Collection } from '../collections/models/collection.model';


@Injectable()
export class ContributionsService {
    constructor(
        @InjectModel(Contribution) private contributionModel: typeof Contribution,
        @InjectModel(File) private fileModel: typeof File,
    ) { }

    async create(data: Partial<Contribution>): Promise<Contribution> {
        return this.contributionModel.create(data as any);
    }

    async findAll() {
        return this.contributionModel.findAll({
            include: [ File, ContributionType, Collection ],
        });
    }

    async findOne(id: string) {
        const contrib = await this.contributionModel.findByPk(id, {
            include: [ContributionType, File, Collection],
        });
        if (!contrib) throw new NotFoundException(`Contribution ${id} not found`);
        return contrib;
    }

    async update(id: string, data: any) {
        const [affected] = await this.contributionModel.update(data, {
            where: { id },
        });
        if (!affected) throw new NotFoundException(`Contribution ${id} not found`);
        return this.findOne(id);
    }

    async remove(id: string) {
        const deleted = await this.contributionModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Contribution ${id} not found`);
        return { message: `Contribution ${id} deleted successfully` };
    }



}