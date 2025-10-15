import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tag } from './models/tag.model';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class TagsService extends BaseService<Tag> {
  constructor(@InjectModel(Tag) private readonly tagModel: typeof Tag) {
    super(tagModel);
  }
}
