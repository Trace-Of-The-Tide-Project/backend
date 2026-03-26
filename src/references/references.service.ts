import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Reference } from './models/reference.model';

@Injectable()
export class ReferencesService extends BaseService<Reference> {
  constructor(
    @InjectModel(Reference) private readonly referenceModel: typeof Reference,
  ) {
    super(referenceModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      searchableFields: ['title', 'author'],
      order: [['created_at', 'DESC']],
    });
  }
}
