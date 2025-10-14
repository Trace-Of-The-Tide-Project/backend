import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Discussion } from './models/discussion.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Collection } from '../collections/models/collection.model';
import { Comment } from '../comments/models/comment.model';

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectModel(Discussion) private readonly discussionModel: typeof Discussion
  ) {}

  async create(data: Partial<Discussion>): Promise<Discussion> {
    return this.discussionModel.create(data as any);
  }

  async findAll(): Promise<Discussion[]> {
    return this.discussionModel.findAll({
      include: [User, Contribution, Collection, Comment],
    });
  }

  async findOne(id: string): Promise<Discussion> {
    const discussion = await this.discussionModel.findByPk(id, {
      include: [User, Contribution, Collection, Comment],
    });

    if (!discussion) throw new NotFoundException(`Discussion ${id} not found`);
    return discussion;
  }

  async update(id: string, data: Partial<Discussion>): Promise<Discussion> {
    const [affected] = await this.discussionModel.update(data, { where: { id } });
    if (!affected) throw new NotFoundException(`Discussion ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.discussionModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Discussion ${id} not found`);
    return { message: `Discussion ${id} deleted successfully` };
  }
}
