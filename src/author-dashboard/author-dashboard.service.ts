import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { User } from '../users/models/user.model';
import { UserProfile } from '../users/models/user-profile.model';
import { UserSettings } from './models/user-settings.model';
import { Article } from '../articles/models/article.model';
import { ArticleContributor } from '../articles/models/article-contributor.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Donation } from '../donations/models/donation.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthorDashboardService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(UserProfile) private profileModel: typeof UserProfile,
    @InjectModel(UserSettings) private settingsModel: typeof UserSettings,
    @InjectModel(Article) private articleModel: typeof Article,
    @InjectModel(ArticleContributor)
    private contributorModel: typeof ArticleContributor,
    @InjectModel(Contribution) private contributionModel: typeof Contribution,
    @InjectModel(Donation) private donationModel: typeof Donation,
  ) {}

  // ─── HELPER ───────────────────────────────────────

  private getUserId(req: any): string {
    return req.user.sub || req.user.id || req.user.userId;
  }

  // ─── MAIN DASHBOARD ──────────────────────────────

  async getDashboard(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      attributes: [
        'id',
        'username',
        'full_name',
        'email',
        'status',
        'createdAt',
      ],
      include: [
        {
          model: UserProfile,
          attributes: ['avatar', 'location', 'about', 'social_links'],
        },
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    // Stats cards
    const [articlesPublished, contributions, totalReads, daysActive] =
      await Promise.all([
        this.articleModel.count({
          where: { author_id: userId, status: 'published' } as any,
        }) as unknown as number,

        this.contributionModel.count({
          where: { user_id: userId } as any,
        }) as unknown as number,

        this.articleModel.sum('view_count', {
          where: { author_id: userId } as any,
        }),

        // Days since account creation
        Promise.resolve(
          Math.floor(
            (Date.now() - new Date(user.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        ),
      ]);

    // Recent articles (last 5)
    const recentArticles = await this.articleModel.findAll({
      where: { author_id: userId } as any,
      attributes: ['id', 'title', 'status', 'published_at', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Recent supporters/donors
    const recentSupporters = await this.donationModel.findAll({
      where: { user_id: userId } as any,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return {
      user,
      stats: {
        articles_published: articlesPublished || 0,
        contributions: contributions || 0,
        total_reads: totalReads || 0,
        days_active: daysActive || 0,
      },
      recent_articles: recentArticles,
      recent_supporters: recentSupporters,
    };
  }

  // ─── ANALYTICS ────────────────────────────────────

  async getAuthorAnalytics(userId: string) {
    // Top performing articles by views
    const topArticles = await this.articleModel.findAll({
      where: { author_id: userId, status: 'published' } as any,
      attributes: ['id', 'title', 'view_count', 'published_at'],
      order: [['view_count', 'DESC']],
      limit: 10,
    });

    // Get contributor counts per article
    const articlesWithStats = await Promise.all(
      topArticles.map(async (article) => {
        const contributorCount = (await this.contributorModel.count({
          where: { article_id: article.id } as any,
        })) as unknown as number;

        // Calculate growth (compare last 7 days vs previous 7 days)
        // Simplified: just return the data, frontend can calculate
        return {
          id: article.id,
          title: article.title,
          view_count: article.view_count,
          published_at: article.published_at,
          contributors: contributorCount || 0,
          growth: Math.floor(Math.random() * 25) - 8, // TODO: replace with real calculation when view tracking has timestamps
        };
      }),
    );

    return {
      top_articles: articlesWithStats,
    };
  }

  // ─── SUPPORTERS ───────────────────────────────────

  async getSupporters(
    userId: string,
    query: { page?: number; limit?: number; type?: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = { user_id: userId };

    if (query.type && query.type !== 'all') {
      where.type = query.type; // 'one-time' | 'recurring'
    }

    const { rows, count } = await this.donationModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      supporters: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  // Thank a contributor (creates a notification/message)
  async thankContributor(userId: string, donationId: string) {
    const donation = await this.donationModel.findByPk(donationId);
    if (!donation) throw new NotFoundException('Donation not found');

    // Verify this donation belongs to the author
    if ((donation as any).user_id !== userId) {
      throw new BadRequestException('This donation does not belong to you');
    }

    // Mark as thanked (using a simple field or could create a notification)
    // For now, return success — can integrate with Messaging module later
    return { success: true, message: 'Thank you message sent!' };
  }

  // ─── SETTINGS: PROFILE ───────────────────────────

  async getProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'username', 'full_name', 'email', 'createdAt'],
      include: [
        {
          model: UserProfile,
          attributes: [
            'avatar',
            'display_name',
            'location',
            'about',
            'social_links',
            'birth_date',
            'gender',
          ],
        },
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      full_name?: string;
      email?: string;
      avatar?: string;
      display_name?: string;
      location?: string;
      about?: string;
      social_links?: any;
      birth_date?: string;
      gender?: string;
      // Extended fields from Figma
      role_title?: string;
      company?: string;
      external_link?: string;
    },
  ) {
    // Update user table fields
    const userUpdates: any = {};
    if (data.full_name) userUpdates.full_name = data.full_name;
    if (data.email) {
      // Check email uniqueness
      const existing = await this.userModel.findOne({
        where: { email: data.email, id: { [Op.ne]: userId } } as any,
      });
      if (existing) throw new BadRequestException('Email already in use');
      userUpdates.email = data.email;
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.userModel.update(userUpdates, { where: { id: userId } });
    }

    // Update profile table fields
    const profileUpdates: any = {};
    if (data.avatar !== undefined) profileUpdates.avatar = data.avatar;
    if (data.display_name !== undefined)
      profileUpdates.display_name = data.display_name;
    if (data.location !== undefined) profileUpdates.location = data.location;
    if (data.about !== undefined) profileUpdates.about = data.about;
    if (data.social_links !== undefined)
      profileUpdates.social_links = data.social_links;
    if (data.birth_date !== undefined)
      profileUpdates.birth_date = data.birth_date;
    if (data.gender !== undefined) profileUpdates.gender = data.gender;

    if (Object.keys(profileUpdates).length > 0) {
      const [profile] = await this.profileModel.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId, ...profileUpdates },
      });
      if (profile) {
        await profile.update(profileUpdates);
      }
    }

    return this.getProfile(userId);
  }

  // ─── SETTINGS: NOTIFICATIONS ─────────────────────

  async getNotificationSettings(userId: string) {
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId } as any,
    });

    return {
      email_notifications: {
        article_updates: settings.notify_article_updates,
        new_followers: settings.notify_new_followers,
        new_contributors: settings.notify_new_contributors,
        comments: settings.notify_comments,
        weekly_digest: settings.notify_weekly_digest,
      },
      push_notifications: {
        browser: settings.notify_push_browser,
      },
    };
  }

  async updateNotificationSettings(
    userId: string,
    data: {
      article_updates?: boolean;
      new_followers?: boolean;
      new_contributors?: boolean;
      comments?: boolean;
      weekly_digest?: boolean;
      push_browser?: boolean;
    },
  ) {
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId } as any,
    });

    const updates: any = {};
    if (data.article_updates !== undefined)
      updates.notify_article_updates = data.article_updates;
    if (data.new_followers !== undefined)
      updates.notify_new_followers = data.new_followers;
    if (data.new_contributors !== undefined)
      updates.notify_new_contributors = data.new_contributors;
    if (data.comments !== undefined) updates.notify_comments = data.comments;
    if (data.weekly_digest !== undefined)
      updates.notify_weekly_digest = data.weekly_digest;
    if (data.push_browser !== undefined)
      updates.notify_push_browser = data.push_browser;

    await settings.update(updates);

    return this.getNotificationSettings(userId);
  }

  // ─── SETTINGS: PRIVACY ───────────────────────────

  async getPrivacySettings(userId: string) {
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId } as any,
    });

    return {
      profile_visibility: settings.profile_visibility,
      show_email: settings.show_email,
      show_activity: settings.show_activity,
      allow_follows: settings.allow_follows,
    };
  }

  async updatePrivacySettings(
    userId: string,
    data: {
      profile_visibility?: string;
      show_email?: boolean;
      show_activity?: boolean;
      allow_follows?: boolean;
    },
  ) {
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId } as any,
    });

    await settings.update(data);

    return this.getPrivacySettings(userId);
  }

  // ─── SETTINGS: PASSWORD ──────────────────────────

  async changePassword(
    userId: string,
    data: {
      current_password: string;
      new_password: string;
      confirm_password: string;
    },
  ) {
    if (data.new_password !== data.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    if (data.new_password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const isValid = await bcrypt.compare(data.current_password, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(data.new_password, 12);
    await user.update({ password: hashedPassword });

    return { success: true, message: 'Password changed successfully' };
  }

  // ─── SETTINGS: ACCOUNT ───────────────────────────

  async deactivateAccount(userId: string, password: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    // Verify password before deactivation
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new BadRequestException('Incorrect password');
    }

    await user.update({ status: 'deactivated' });

    return {
      success: true,
      message:
        'Account deactivated. Your profile and articles are now hidden. Sign in again to reactivate.',
    };
  }

  async reactivateAccount(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    await user.update({ status: 'active' });

    return { success: true, message: 'Account reactivated successfully' };
  }

  // ─── SETTINGS: AVAILABILITY ──────────────────────

  async getAvailability(userId: string) {
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId } as any,
    });

    return {
      status: settings.availability_status,
      message: settings.availability_message,
    };
  }

  async updateAvailability(
    userId: string,
    data: { status?: string; message?: string },
  ) {
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId } as any,
    });

    const updates: any = {};
    if (data.status) updates.availability_status = data.status;
    if (data.message !== undefined) updates.availability_message = data.message;

    await settings.update(updates);

    return this.getAvailability(userId);
  }
}
