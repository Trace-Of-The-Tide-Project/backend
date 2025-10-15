import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Comment } from './models/comment.model';
import { User } from '../users/models/user.model';
import { Discussion } from '../discussions/models/discussion.model';

@Injectable()
export class CommentsService extends BaseService<Comment> {
  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
  ) {
    super(commentModel);
  }

  // Include relations in findAll
  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: [User, Discussion, { model: Comment, as: 'replies' }],
      searchableFields: ['content'],
      order: [['created_at', 'DESC']],
    });
  }

  // Include relations in findOne
  async findOne(id: string) {
    return super.findOne(id, {
      include: [User, Discussion, { model: Comment, as: 'replies' }],
    });
  }
}
