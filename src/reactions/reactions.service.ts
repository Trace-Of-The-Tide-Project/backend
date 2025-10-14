import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Reaction } from './models/reaction.model';
import { User } from '../users/models/user.model';
import { Comment } from '../comments/models/comment.model';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction) private readonly reactionModel: typeof Reaction
  ) {}

  async create(data: Partial<Reaction>): Promise<Reaction> {
    return this.reactionModel.create(data as any);
  }
  
  async findAll() {
    const reactions = await this.reactionModel.findAll({
      include: [User, Comment],
    });
    return {
      status: 200,
      results: reactions.length,
      data: reactions,
    };
  }

  async findOne(id: string): Promise<Reaction> {
    const reaction = await this.reactionModel.findByPk(id, {
      include: [User, Comment],
    });
    if (!reaction) throw new NotFoundException(`Reaction ${id} not found`);
    return reaction;
  }

  async update(id: string, data: Partial<Reaction>): Promise<Reaction> {
    const [affected] = await this.reactionModel.update(data, { where: { id } });
    if (!affected) throw new NotFoundException(`Reaction ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.reactionModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Reaction ${id} not found`);
    return { message: `Reaction ${id} deleted successfully` };
  }
}
