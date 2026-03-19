import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Reaction } from './models/reaction.model';
import { User } from '../users/models/user.model';
import { Comment } from '../comments/models/comment.model';

@Injectable()
export class ReactionsService extends BaseService<Reaction> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name'] },
    { model: Comment, attributes: ['id', 'content', 'discussion_id'] },
  ];

  constructor(
    @InjectModel(Reaction) private readonly reactionModel: typeof Reaction,
  ) {
    super(reactionModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['type'],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  /**
   * Toggle a reaction — if the same user+comment+type exists, remove it.
   * If a different type exists, switch it. Otherwise create new.
   * This is how reactions work in any real app (like/unlike toggle).
   */
  async toggleReaction(userId: string, commentId: string, type: string) {
    // Check if user already reacted to this comment
    const existing = await this.reactionModel.findOne({
      where: { user_id: userId, comment_id: commentId },
    });

    if (existing) {
      if (existing.type === type) {
        // Same type — remove (unlike/untoggle)
        await existing.destroy();
        return { action: 'removed', type };
      } else {
        // Different type — switch (e.g. like → love)
        await existing.update({ type });
        return {
          action: 'switched',
          from: existing.type,
          to: type,
          reaction: await this.reactionModel.findByPk(existing.id, {
            include: this.defaultInclude,
          }),
        };
      }
    }

    // No existing reaction — create new
    const reaction = await this.reactionModel.create({
      user_id: userId,
      comment_id: commentId,
      type,
    } as any);

    return {
      action: 'added',
      type,
      reaction: await this.reactionModel.findByPk(reaction.id, {
        include: this.defaultInclude,
      }),
    };
  }

  /**
   * Get reaction summary for a comment (counts by type).
   */
  async getCommentReactions(commentId: string) {
    const reactions = await this.reactionModel.findAll({
      where: { comment_id: commentId },
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
    });

    // Group by type
    const summary: Record<string, { count: number; users: any[] }> = {};
    for (const r of reactions) {
      if (!summary[r.type]) {
        summary[r.type] = { count: 0, users: [] };
      }
      summary[r.type].count++;
      summary[r.type].users.push(r.user);
    }

    return {
      commentId,
      total: reactions.length,
      byType: summary,
    };
  }
}
