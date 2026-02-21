import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Discussion } from './models/discussion.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Collection } from '../collections/models/collection.model';
import { Comment } from '../comments/models/comment.model';

@Injectable()
export class DiscussionsService extends BaseService<Discussion> {
  private readonly defaultInclude = [
    { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
    { model: Contribution, attributes: ['id', 'title', 'status'] },
    { model: Collection, attributes: ['id', 'name'] },
    {
      model: Comment,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name'] },
      ],
    },
  ];

  constructor(
    @InjectModel(Discussion)
    private readonly discussionModel: typeof Discussion,
  ) {
    super(discussionModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

}