import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Reaction } from './models/reaction.model';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class ReactionsService extends BaseService<Reaction> {
  constructor(
    @InjectModel(Reaction) private readonly reactionModel: typeof Reaction,
  ) {
    super(reactionModel);
  }

  async findAll(
    query: any,
    options?: { searchableFields?: string[]; include?: any[] },
  ) {
    const { rows, meta } = await super.findAll(query, {
      searchableFields: ['type'],
      include: ['user', 'comment'],
    });

    return { rows, meta };
  }

  async findOne(id: string) {
    const reaction = await this.model.findByPk(id, {
      include: ['user', 'comment'],
    });
    if (!reaction) throw new NotFoundException(`Reaction ${id} not found`);
    return reaction;
  }
}
