import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Comment } from './models/comment.model';
import { User } from '../users/models/user.model';
import { Discussion } from '../discussions/models/discussion.model';

@Injectable()
export class CommentsService extends BaseService<Comment> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name'] },
    { model: Discussion, attributes: ['id', 'title'] },
    {
      model: Comment,
      as: 'replies',
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
    },
  ];

  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
  ) {
    super(commentModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['content'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async create(data: Partial<Comment>) {
    const createData: any = { ...data };

    if (createData.parent_comment_id) {
      const parent = await this.commentModel.findByPk(
        createData.parent_comment_id,
      );
      if (parent) {
        createData.depth = (parent.depth || 0) + 1;
        createData.thread_root_id = parent.thread_root_id || parent.id;
      }
    } else {
      createData.depth = 0;
    }

    return this.commentModel.create(createData);
  }
}
