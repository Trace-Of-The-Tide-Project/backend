import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Contribution } from './models/contribution.model';
import { ContributionType } from './models/contribution-type.model';
import { File } from '../files/models/file.model';
import { Collection } from '../collections/models/collection.model';
import { User } from '../users/models/user.model';

@Injectable()
export class ContributionsService extends BaseService<Contribution> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
    ContributionType,
    File,
    Collection,
  ];

  constructor(
    @InjectModel(Contribution)
    private readonly contributionModel: typeof Contribution,
  ) {
    super(contributionModel);
  }

  /**
   * Find all contributions with pagination, search, filtering, and sorting.
   * Passes the raw query object through to BaseService which handles
   * page, limit, search, sortBy, order, and dynamic where clauses.
   */
  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  /**
   * Create a contribution with sensible defaults for submission_date and status.
   */
  async create(data: Partial<Contribution>) {
    return this.contributionModel.create({
      submission_date: new Date(),
      status: 'draft',
      ...data,
    } as any);
  }

  /**
   * Update returns the record with all relations included
   * because BaseService.update() calls this.findOne() which is overridden above.
   */
  async update(id: string, data: Partial<Contribution>) {
    return super.update(id, data);
  }
}