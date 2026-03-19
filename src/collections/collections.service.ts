import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Collection } from './models/collection.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';

@Injectable()
export class CollectionsService extends BaseService<Collection> {
  private readonly defaultInclude = [
    { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
    {
      model: Contribution,
      attributes: ['id', 'title', 'status', 'submission_date'],
      through: { attributes: [] }, // hide junction table fields
    },
  ];

  constructor(
    @InjectModel(Collection)
    private readonly collectionModel: typeof Collection,
  ) {
    super(collectionModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['name', 'description'],
      order: [['created_date', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }
}
