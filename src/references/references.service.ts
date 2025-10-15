import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Reference } from './models/reference.model';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class ReferencesService extends BaseService<Reference> {
  constructor(
    @InjectModel(Reference) private readonly referenceModel: typeof Reference,
  ) {
    super(referenceModel);
  }
}
