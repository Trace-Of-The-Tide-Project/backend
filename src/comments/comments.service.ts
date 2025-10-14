import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Comment } from '../comments/models/comment.model';
import { User } from '../users/models/user.model';
import { Discussion } from '../discussions/models/discussion.model';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment) private readonly commentModel: typeof Comment
  ) {}

  async create(data: Partial<Comment>): Promise<Comment> {
    return this.commentModel.create(data as any);
  }

  async findAll(): Promise<Comment[]> {
    return this.commentModel.findAll({
      include: [User, Discussion, { model: Comment, as: 'replies' }],
    });
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentModel.findByPk(id, {
      include: [User, Discussion, { model: Comment, as: 'replies' }],
    });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return comment;
  }

  async update(id: string, data: Partial<Comment>): Promise<Comment> {
    const [affected] = await this.commentModel.update(data, { where: { id } });
    if (!affected) throw new NotFoundException(`Comment ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.commentModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Comment ${id} not found`);
    return { message: `Comment ${id} deleted successfully` };
  }
}
