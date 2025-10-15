import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Discussion } from './models/discussion.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Collection } from '../collections/models/collection.model';
import { Comment } from '../comments/models/comment.model';

@Injectable()
export class DiscussionsService extends BaseService<Discussion> {
  constructor(
    @InjectModel(Discussion)
    private readonly discussionModel: typeof Discussion,
  ) {
    super(discussionModel);
  }

  async findAll() {
    return super.findAll([User, Contribution, Collection, Comment]);
  }

  async findOne(id: string) {
    const discussion = await super.findOne(id, [
      User,
      Contribution,
      Collection,
      Comment,
    ] as any);
    if (!discussion) throw new NotFoundException(`Discussion ${id} not found`);
    return discussion;
  }

  async update(id: string, data: Partial<Discussion>) {
    const [affected] = await this.discussionModel.update(data, {
      where: { id },
    });
    if (!affected) throw new NotFoundException(`Discussion ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleted = await this.discussionModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Discussion ${id} not found`);
    return { message: `Discussion ${id} deleted successfully` };
  }
}
