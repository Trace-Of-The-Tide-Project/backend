import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from 'src/common/base.service';
import { Collection } from './models/collection.model';

@Injectable()
export class CollectionsService extends BaseService<Collection> {
  constructor(
    @InjectModel(Collection)
    private readonly collectionModel: typeof Collection,
  ) {
    super(collectionModel);
  }

  async findOne(id: string) {
    return super.findOne(id, ['collectionContributions'] as any);
  }
}
