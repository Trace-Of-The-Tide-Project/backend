import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Tag } from './models/tag.model';

@Injectable()
export class TagsService extends BaseService<Tag> {
  constructor(@InjectModel(Tag) private readonly tagModel: typeof Tag) {
    super(tagModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      searchableFields: ['name'],
      order: [['name', 'ASC']],
    });
  }

  async create(data: Partial<Tag>) {
    const existing = await this.tagModel.findOne({
      where: { name: (data as any).name },
    });
    if (existing) throw new BadRequestException('Tag already exists');
    return super.create(data);
  }
}