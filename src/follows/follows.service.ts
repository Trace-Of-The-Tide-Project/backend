import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Follow } from './models/follow.model';
import { User } from '../users/models/user.model';
import { UserProfile } from '../users/models/user-profile.model';
import { UserSettings } from '../author-dashboard/models/user-settings.model';
import { Notification } from '../notifications/models/notification.model';

@Injectable()
export class FollowsService extends BaseService<Follow> {
  private readonly userAttributes = ['id', 'username', 'full_name'];

  constructor(
    @InjectModel(Follow) private readonly followModel: typeof Follow,
    @InjectModel(UserSettings)
    private readonly userSettingsModel: typeof UserSettings,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {
    super(followModel);
  }

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if target user allows follows
    const settings = await this.userSettingsModel.findOne({
      where: { user_id: followingId },
    });
    if (settings && !settings.allow_follows) {
      throw new ForbiddenException('This user does not allow follows');
    }

    // Toggle: remove if exists, create if not
    const existing = await this.followModel.findOne({
      where: { follower_id: followerId, following_id: followingId },
    });

    if (existing) {
      await existing.destroy();
      return { followed: false, message: 'Unfollowed successfully' };
    }

    await this.followModel.create({
      follower_id: followerId,
      following_id: followingId,
    } as any);

    // Send notification if user wants it
    if (!settings || settings.notify_new_followers) {
      await this.notificationModel.create({
        user_id: followingId,
        type: 'new_follower',
        message: 'You have a new follower',
        status: 'unread',
      } as any);
    }

    return { followed: true, message: 'Followed successfully' };
  }

  async getFollowers(userId: string, query: any = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await this.followModel.findAndCountAll({
      where: { following_id: userId },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: this.userAttributes,
          include: [
            { model: UserProfile, attributes: ['avatar', 'display_name'] },
          ],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      rows,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async getFollowing(userId: string, query: any = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await this.followModel.findAndCountAll({
      where: { follower_id: userId },
      include: [
        {
          model: User,
          as: 'following',
          attributes: this.userAttributes,
          include: [
            { model: UserProfile, attributes: ['avatar', 'display_name'] },
          ],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      rows,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async getFollowCounts(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      this.followModel.count({ where: { following_id: userId } }),
      this.followModel.count({ where: { follower_id: userId } }),
    ]);
    return { followersCount, followingCount };
  }

  async isFollowing(followerId: string, followingId: string) {
    const existing = await this.followModel.findOne({
      where: { follower_id: followerId, following_id: followingId },
    });
    return { isFollowing: !!existing };
  }
}
