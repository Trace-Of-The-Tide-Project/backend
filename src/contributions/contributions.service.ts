import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Contribution } from './models/contribution.model';
import { File } from '../files/models/file.model';
import { ContributionType } from './models/contribution-type.model';
import { Collection } from '../collections/models/collection.model';

@Injectable()
export class ContributionsService extends BaseService<Contribution> {
  constructor(
    @InjectModel(Contribution)
    private readonly contributionModel: typeof Contribution,
  ) {
    super(contributionModel);
  }

  // override findAll to inject include relations
  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: [File, ContributionType, Collection],
      searchableFields: ['title', 'description'],
      order: [['created_at', 'DESC']],
    });
  }

  // override findOne to include relations as well
  async findOne(id: string) {
    return super.findOne(id, { include: [File, ContributionType, Collection] });
  }
}
