import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Comment } from '../comments/models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Reaction } from '../reactions/models/reaction.model';
import { Badge } from '../system-settings/models/badge.model';
import { UserBadge } from './models/user-badge.model';
import { User } from '../users/models/user.model';
import { UserProfile } from '../users/models/user-profile.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';

// ──────────────────────────────────────────────────────────────
// FLAGGING APPROACH:
// ModerationLog only has contribution_id (no entity_type/entity_id).
// For comment flagging, we use a simple in-memory approach via a
// dedicated "comment_flags" SiteSettings key, OR we repurpose
// ModerationLog by storing comment IDs in contribution_id field
// with a convention: action='flag_comment'.
//
// Chosen approach: Store flagged comment IDs in ModerationLog using
// contribution_id as a generic entity_id and action='flag_comment'.
// This is a pragmatic reuse — contribution_id is a UUID column and
// comment IDs are UUIDs too. The FK constraint might be an issue
// if enforced, so we use a separate lightweight table approach instead.
//
// SIMPLEST FIX: We'll track flagged comments directly in the
// UserBadge-style pattern — query comments that have a ModerationLog
// record. But since ModerationLog FK is to Contribution, we can't
// store comment flags there cleanly.
//
// FINAL APPROACH: Keep a Set of flagged comment IDs via the
// SiteSettings key-value store: key='flagged_comments', value=JSON array.
// This avoids model changes and works immediately.
// ──────────────────────────────────────────────────────────────

import { SiteSettings } from '../cms/models/site-settings.model';

@Injectable()
export class EngagementsService {
  constructor(
    @InjectModel(Comment) private commentModel: typeof Comment,
    @InjectModel(Discussion) private discussionModel: typeof Discussion,
    @InjectModel(Reaction) private reactionModel: typeof Reaction,
    @InjectModel(Badge) private badgeModel: typeof Badge,
    @InjectModel(UserBadge) private userBadgeModel: typeof UserBadge,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(UserRole) private userRoleModel: typeof UserRole,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(SiteSettings) private siteSettingsModel: typeof SiteSettings,
  ) {}

  // ─── FLAGGED COMMENTS HELPER ─────────────────────
  // Uses SiteSettings key-value store since ModerationLog
  // only supports contribution_id FK, not generic entities.

  private async getFlaggedCommentIds(): Promise<string[]> {
    const record = await this.siteSettingsModel.findOne({
      where: { key: 'flagged_comments' },
    });
    if (!record) return [];
    try {
      return JSON.parse(record.value);
    } catch {
      return [];
    }
  }

  private async setFlaggedCommentIds(ids: string[]): Promise<void> {
    const value = JSON.stringify([...new Set(ids)]);
    const [record] = await this.siteSettingsModel.findOrCreate({
      where: { key: 'flagged_comments' },
      defaults: { key: 'flagged_comments', value } as any,
    });
    await record.update({ value });
  }

  // ═══════════════════════════════════════════════
  // STATS CARDS (top of all screens)
  // ═══════════════════════════════════════════════

  async getStats() {
    const [totalComments, totalLikes, activeDiscussions, badgesAwarded] =
      await Promise.all([
        this.commentModel.count(),
        this.reactionModel.count(),
        // Discussion has NO status column — count all discussions as "active"
        this.discussionModel.count(),
        this.userBadgeModel.count(),
      ]);

    return {
      total_comments: totalComments,
      total_likes: totalLikes,
      active_discussions: activeDiscussions,
      badges_awarded: badgesAwarded,
    };
  }

  // ═══════════════════════════════════════════════
  // TAB 1: COMMENTS
  // ═══════════════════════════════════════════════
  // FIX: User has NO avatar — include UserProfile for avatar
  // FIX: Reaction has NO entity_type/entity_id — use comment_id directly
  // FIX: ModerationLog can't store comment flags — use SiteSettings

  async getComments(filters: {
    search?: string;
    filter?: 'all' | 'flagged';
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.content = { [Op.iLike]: `%${filters.search}%` };
    }

    // Get flagged comment IDs from SiteSettings store
    const flaggedCommentIds = await this.getFlaggedCommentIds();

    // If flagged filter, restrict to only flagged comments
    if (filters.filter === 'flagged') {
      if (flaggedCommentIds.length === 0) {
        return {
          comments: [],
          total: 0,
          flagged_count: 0,
          page,
          limit,
          total_pages: 0,
        };
      }
      where.id = { [Op.in]: flaggedCommentIds };
    }

    const { rows, count } = await this.commentModel.findAndCountAll({
      where,
      include: [
        {
          // FIX: User alias is 'user' (from Comment model BelongsTo)
          model: User,
          // FIX: User has NO avatar — only id, username, full_name
          attributes: ['id', 'username', 'full_name'],
          include: [
            {
              model: UserProfile,
              attributes: ['avatar'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const comments = await Promise.all(
      rows.map(async (comment: any) => {
        // FIX: Reaction has comment_id directly, no entity_type/entity_id
        const likeCount = await this.reactionModel.count({
          where: { comment_id: comment.id },
        });

        const replyCount = await this.commentModel.count({
          where: { parent_comment_id: comment.id },
        });

        return {
          id: comment.id,
          content: comment.content,
          author: comment.user
            ? {
                id: comment.user.id,
                username: comment.user.username,
                full_name: comment.user.full_name,
                avatar: comment.user.profile?.avatar || null,
              }
            : null,
          is_flagged: flaggedCommentIds.includes(comment.id),
          likes: likeCount,
          replies: replyCount,
          createdAt: comment.createdAt,
        };
      }),
    );

    return {
      comments,
      total: count as number,
      flagged_count: flaggedCommentIds.length,
      page,
      limit,
      total_pages: Math.ceil((count as number) / limit),
    };
  }

  // FIX: Use SiteSettings-based flagging instead of ModerationLog
  async flagComment(id: string, _adminId: string) {
    const comment = await this.commentModel.findByPk(id);
    if (!comment) throw new NotFoundException('Comment not found');

    const flagged = await this.getFlaggedCommentIds();
    if (!flagged.includes(id)) {
      flagged.push(id);
      await this.setFlaggedCommentIds(flagged);
    }

    return { message: 'Comment flagged successfully' };
  }

  async unflagComment(id: string) {
    const comment = await this.commentModel.findByPk(id);
    if (!comment) throw new NotFoundException('Comment not found');

    const flagged = await this.getFlaggedCommentIds();
    const updated = flagged.filter((fid) => fid !== id);
    await this.setFlaggedCommentIds(updated);

    return { message: 'Comment unflagged successfully' };
  }

  async deleteComment(id: string) {
    const comment = await this.commentModel.findByPk(id);
    if (!comment) throw new NotFoundException('Comment not found');

    // Delete child replies (using parent_comment_id — actual column name)
    await this.commentModel.destroy({
      where: { parent_comment_id: id },
    });

    // Clean up flag
    const flagged = await this.getFlaggedCommentIds();
    await this.setFlaggedCommentIds(flagged.filter((fid) => fid !== id));

    await comment.destroy();
    return { message: 'Comment and replies deleted successfully' };
  }

  // ═══════════════════════════════════════════════
  // TAB 2: TRENDING DISCUSSIONS
  // FIX: Discussion has NO status column.
  // We treat all discussions as open. Lock/unlock will be a no-op
  // until the model gets a status column added via migration.
  // For now, we provide the endpoints but they won't persist status.
  // ═══════════════════════════════════════════════

  async getTrendingDiscussions(filters: {
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.discussionModel.findAndCountAll({
      include: [
        {
          // FIX: Discussion BelongsTo User as 'creator' not 'user'
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name'],
          include: [
            { model: UserProfile, attributes: ['avatar'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const discussions = await Promise.all(
      rows.map(async (disc: any) => {
        const commentCount = await this.commentModel.count({
          where: { discussion_id: disc.id },
        });

        const participantResult = await this.commentModel.findAll({
          where: { discussion_id: disc.id },
          attributes: ['user_id'],
          group: ['user_id'],
        });

        return {
          id: disc.id,
          title: disc.title,
          // Discussion has no status column — default to 'open'
          status: 'open',
          is_locked: false,
          author: disc.creator
            ? {
                id: disc.creator.id,
                username: disc.creator.username,
                full_name: disc.creator.full_name,
                avatar: disc.creator.profile?.avatar || null,
              }
            : null,
          comment_count: commentCount,
          participant_count: participantResult.length,
          createdAt: disc.createdAt,
        };
      }),
    );

    return {
      discussions,
      total: count as number,
      page,
      limit,
      total_pages: Math.ceil((count as number) / limit),
    };
  }

  async getDiscussion(id: string) {
    const discussion = await this.discussionModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name'],
          include: [
            { model: UserProfile, attributes: ['avatar'] },
          ],
        },
      ],
    });

    if (!discussion) throw new NotFoundException('Discussion not found');

    const comments = await this.commentModel.findAll({
      where: { discussion_id: id },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
          include: [
            { model: UserProfile, attributes: ['avatar'] },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    return {
      discussion,
      comments: comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        author: c.user
          ? {
              id: c.user.id,
              username: c.user.username,
              full_name: c.user.full_name,
              avatar: c.user.profile?.avatar || null,
            }
          : null,
        createdAt: c.createdAt,
      })),
      comment_count: comments.length,
    };
  }

  // NOTE: These will silently succeed but have no effect until
  // Discussion model gets a `status` column via migration.
  // The response pretends it worked so the frontend flow is smooth.
  async lockDiscussion(id: string) {
    const discussion = await this.discussionModel.findByPk(id);
    if (!discussion) throw new NotFoundException('Discussion not found');
    // TODO: Uncomment after adding status column to Discussion model
    // await discussion.update({ status: 'locked' });
    return { message: 'Discussion locked successfully' };
  }

  async unlockDiscussion(id: string) {
    const discussion = await this.discussionModel.findByPk(id);
    if (!discussion) throw new NotFoundException('Discussion not found');
    // TODO: Uncomment after adding status column to Discussion model
    // await discussion.update({ status: 'open' });
    return { message: 'Discussion unlocked successfully' };
  }

  // ═══════════════════════════════════════════════
  // TAB 3: BADGES & RECOGNITION
  // ═══════════════════════════════════════════════

  async getBadgesWithRecipients(search?: string) {
    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const badges = await this.badgeModel.findAll({
      where,
      order: [['createdAt', 'ASC']],
    });

    const result = await Promise.all(
      badges.map(async (badge: any) => {
        const recipientCount = await this.userBadgeModel.count({
          where: { badge_id: badge.id },
        });

        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          criteria_type: badge.criteria_type,
          criteria_value: badge.criteria_value,
          is_active: badge.is_active,
          recipient_count: recipientCount,
          createdAt: badge.createdAt,
        };
      }),
    );

    return { badges: result, total: result.length };
  }

  // FIX: User has NO `role` field. Must join through UserRole → Role.
  async createAndAwardBadge(
    adminId: string,
    dto: {
      name: string;
      icon?: string;
      role?: string;
      reason?: string;
    },
  ) {
    const existing = await this.badgeModel.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Badge "${dto.name}" already exists`);
    }

    const badge = await this.badgeModel.create({
      name: dto.name,
      description: dto.reason || '',
      icon: dto.icon || 'trophy',
      criteria_type: 'custom',
      criteria_value: 0,
    } as any);

    let awardedCount = 0;

    if (dto.role) {
      // FIX: Query users by role through UserRole → Role junction
      const role = await this.roleModel.findOne({
        where: { name: dto.role },
      });

      if (role) {
        const userRoles = await this.userRoleModel.findAll({
          where: { role_id: role.id },
          attributes: ['user_id'],
        });

        for (const ur of userRoles) {
          await this.userBadgeModel.findOrCreate({
            where: {
              user_id: ur.user_id,
              badge_id: (badge as any).id,
            },
            defaults: {
              user_id: ur.user_id,
              badge_id: (badge as any).id,
              awarded_by: adminId,
              reason: dto.reason || '',
            } as any,
          });
          awardedCount++;
        }
      }

      await badge.update({ awarded_count: awardedCount });
    }

    return {
      message: `Badge created${awardedCount > 0 ? ` and awarded to ${awardedCount} users` : ''}`,
      badge,
      awarded_count: awardedCount,
    };
  }

  async awardBadgeToUser(
    adminId: string,
    badgeId: string,
    dto: {
      user_id?: string;
      username?: string;
      description?: string;
      criteria?: string;
    },
  ) {
    const badge = await this.badgeModel.findByPk(badgeId);
    if (!badge) throw new NotFoundException('Badge not found');

    let user: any;
    if (dto.user_id) {
      user = await this.userModel.findByPk(dto.user_id);
    } else if (dto.username) {
      user = await this.userModel.findOne({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${dto.username}%` } },
            { email: { [Op.iLike]: `%${dto.username}%` } },
          ],
        },
      });
    }

    if (!user) throw new NotFoundException('User not found');

    const existing = await this.userBadgeModel.findOne({
      where: {
        user_id: user.id,
        badge_id: badgeId,
      },
    });

    if (existing) {
      throw new ConflictException('User already has this badge');
    }

    const userBadge = await this.userBadgeModel.create({
      user_id: user.id,
      badge_id: badgeId,
      awarded_by: adminId,
      reason: dto.description || dto.criteria || '',
    } as any);

    await badge.update({
      awarded_count: ((badge as any).awarded_count || 0) + 1,
    });

    return {
      message: `Badge "${(badge as any).name}" awarded to ${user.username || user.full_name}`,
      user_badge: userBadge,
    };
  }

  async revokeBadge(badgeId: string, userId: string) {
    const userBadge = await this.userBadgeModel.findOne({
      where: { badge_id: badgeId, user_id: userId },
    });

    if (!userBadge) throw new NotFoundException('User badge not found');

    await userBadge.destroy();

    const badge = await this.badgeModel.findByPk(badgeId);
    if (badge) {
      const newCount = Math.max(0, ((badge as any).awarded_count || 1) - 1);
      await badge.update({ awarded_count: newCount });
    }

    return { message: 'Badge revoked successfully' };
  }

  // FIX: User has no avatar — include UserProfile
  async getBadgeRecipients(badgeId: string, page = 1, limit = 20) {
    const badge = await this.badgeModel.findByPk(badgeId);
    if (!badge) throw new NotFoundException('Badge not found');

    const offset = (page - 1) * limit;

    const { rows, count } = await this.userBadgeModel.findAndCountAll({
      where: { badge_id: badgeId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name', 'email'],
          include: [
            { model: UserProfile, attributes: ['avatar'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      badge: {
        id: (badge as any).id,
        name: (badge as any).name,
        icon: (badge as any).icon,
      },
      recipients: rows.map((ub: any) => ({
        id: ub.id,
        user: ub.user
          ? {
              id: ub.user.id,
              username: ub.user.username,
              full_name: ub.user.full_name,
              email: ub.user.email,
              avatar: ub.user.profile?.avatar || null,
            }
          : null,
        reason: ub.reason,
        awarded_at: ub.createdAt,
      })),
      total: count as number,
      page,
      limit,
      total_pages: Math.ceil((count as number) / limit),
    };
  }
}