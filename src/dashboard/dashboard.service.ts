import { Injectable } from '@nestjs/common';
import { Op, fn, col, literal } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { UserProfile } from '../users/models/user-profile.model';
import { Role } from '../roles/models/role.model';
import { Contribution } from '../contributions/models/contribution.model';
import { ContributionType } from '../contributions/models/contribution-type.model';
import { File } from '../files/models/file.model';
import { Donation } from '../donations/models/donation.model';
import { Comment } from '../comments/models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Reaction } from '../reactions/models/reaction.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Collection } from '../collections/models/collection.model';
import { ModerationLog } from '../moderation/models/moderation-log.model';
import { Log } from '../logs/models/log.model';
import { AuditTrail } from '../audit-trails/models/audit-trail.model';
import { Notification } from '../notifications/models/notification.model';

@Injectable()
export class DashboardService {
  constructor(private readonly sequelize: Sequelize) {}

  // ============================================================
  // HELPER: Date range calculations
  // ============================================================

  private getDateRange(period: string = '30d') {
    const now = new Date();
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const days = periodMap[period] || 30;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(
      start.getTime() - days * 24 * 60 * 60 * 1000,
    );
    return { now, start, previousStart };
  }

  private calcPercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  // ============================================================
  // 1. COMMAND CENTER — Top Stats Cards
  //    (Total Users, Content Published, Monthly Donations, Active Today)
  // ============================================================

  async getStats(period: string = '30d') {
    const { now, start, previousStart } = this.getDateRange(period);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // --- Total Users ---
    const totalUsers = await User.count();
    const previousTotalUsers = await User.count({
      where: { createdAt: { [Op.lt]: start } },
    });

    // --- Content Published ---
    const contentPublished = await Contribution.count({
      where: { status: 'published' },
    });
    const previousContentPublished = await Contribution.count({
      where: {
        status: 'published',
        createdAt: { [Op.lt]: start },
      },
    });

    // --- Monthly Donations ---
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const monthlyDonations =
      (await Donation.sum('amount', {
        where: {
          date: { [Op.gte]: monthStart },
          status: 'completed',
        },
      })) || 0;

    const lastMonthDonations =
      (await Donation.sum('amount', {
        where: {
          date: { [Op.gte]: lastMonthStart, [Op.lt]: monthStart },
          status: 'completed',
        },
      })) || 0;

    // --- Active Today (based on updatedAt as proxy, since no lastActiveAt) ---
    const activeToday = await User.count({
      where: {
        updatedAt: { [Op.gte]: todayStart },
        status: 'active',
      },
    });
    const activeYesterday = await User.count({
      where: {
        updatedAt: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart },
        status: 'active',
      },
    });

    return {
      totalUsers: {
        value: totalUsers,
        change: this.calcPercentageChange(totalUsers, previousTotalUsers),
        label: 'vs last month',
      },
      contentPublished: {
        value: contentPublished,
        change: this.calcPercentageChange(
          contentPublished,
          previousContentPublished,
        ),
        label: 'vs last month',
      },
      monthlyDonations: {
        value: monthlyDonations,
        change: this.calcPercentageChange(monthlyDonations, lastMonthDonations),
        label: 'vs last month',
      },
      activeToday: {
        value: activeToday,
        change: this.calcPercentageChange(activeToday, activeYesterday),
        label: 'vs yesterday',
      },
    };
  }

  // ============================================================
  // 2. ALERTS & NOTIFICATIONS
  //    (Flagged content, pending editor apps, unusual activity)
  // ============================================================

  async getAlerts() {
    // Flagged content items
    const flaggedContent = await ModerationLog.count({
      where: { action: 'flagged' },
    });

    // Pending contributions awaiting review
    const pendingReviews = await Contribution.count({
      where: { status: 'pending' },
    });

    // Pending editor applications (users with pending status who requested editor role)
    const pendingEditorApps = (await UserRole.count({
      include: [
        {
          model: Role,
          where: { name: 'editor' },
          as: 'role',
        },
      ],
      where: {
        assigned_at: { [Op.is]: null as any },
      },
    })) as number;

    // Unread admin notifications
    const unreadNotifications = await Notification.count({
      where: { status: 'unread' },
    });

    return {
      flaggedContent,
      pendingReviews,
      pendingEditorApps,
      unreadNotifications,
      items: [
        ...(flaggedContent > 0
          ? [
              {
                type: 'flagged',
                severity: 'critical',
                message: `${flaggedContent} content items flagged`,
                description:
                  'Requires immediate review for policy violations',
              },
            ]
          : []),
        ...(pendingEditorApps > 0
          ? [
              {
                type: 'editor_application',
                severity: 'info',
                message: `${pendingEditorApps} pending editor applications`,
                description: `Awaiting review for more than 16 hours`,
              },
            ]
          : []),
        ...(pendingReviews > 0
          ? [
              {
                type: 'pending_review',
                severity: 'warning',
                message: `${pendingReviews} contributions awaiting review`,
                description: 'Content pending moderation approval',
              },
            ]
          : []),
      ],
    };
  }

  // ============================================================
  // 3. EDITOR APPLICATIONS
  //    (Pending editor role requests with approve/reject)
  // ============================================================

  async getEditorApplications(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { rows, count } = await UserRole.findAndCountAll({
      include: [
        {
          model: Role,
          where: { name: 'editor' },
          as: 'role',
        },
        {
          model: User,
          include: [{ model: UserProfile }],
        },
      ],
      where: {
        assigned_at: { [Op.is]: null as any },
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
    };
  }

  // ============================================================
  // 4. CONTENT OVERVIEW
  //    (Category | Published | Drafts | Flagged table)
  // ============================================================

  async getContentOverview() {
    // Get all contribution types
    const types = await ContributionType.findAll({
      attributes: ['id', 'name'],
    });

    const categories = await Promise.all(
      types.map(async (type) => {
        const [published, drafts, flagged, total] = await Promise.all([
          Contribution.count({
            where: { type_id: type.id, status: 'published' },
          }),
          Contribution.count({
            where: { type_id: type.id, status: 'draft' },
          }),
          Contribution.count({
            where: { type_id: type.id, status: 'flagged' },
          }),
          Contribution.count({
            where: { type_id: type.id },
          }),
        ]);

        return {
          category: type.name,
          typeId: type.id,
          published,
          drafts,
          flagged,
          total,
        };
      }),
    );

    const totalContentPieces = categories.reduce(
      (sum, cat) => sum + cat.total,
      0,
    );

    return {
      categories,
      totalContentPieces,
    };
  }

  // ============================================================
  // 5. USERS BY ROLE
  //    (Users, Contributors, Authors, Editors, Admins + growth %)
  // ============================================================

  async getUsersByRole() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const roles = await Role.findAll({ attributes: ['id', 'name'] });

    const roleStats = await Promise.all(
      roles.map(async (role) => {
        const current = await UserRole.count({
          where: { role_id: role.id },
        });

        const previous = await UserRole.count({
          where: {
            role_id: role.id,
            createdAt: { [Op.lt]: thirtyDaysAgo },
          },
        });

        return {
          role: role.name,
          roleId: role.id,
          count: current,
          change: this.calcPercentageChange(current, previous),
        };
      }),
    );

    const totalUsers = await User.count();

    return {
      roles: roleStats.sort((a, b) => b.count - a.count),
      totalUsers,
    };
  }

  // ============================================================
  // 6. FINANCE SNAPSHOT
  //    (Today's Donations, Monthly Revenue, Pending Payouts, Platform Fees)
  // ============================================================

  async getFinanceSnapshot() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Today's donations
    const todayDonations =
      (await Donation.sum('amount', {
        where: { date: { [Op.gte]: todayStart }, status: 'completed' },
      })) || 0;

    const todayDonationCount = await Donation.count({
      where: { date: { [Op.gte]: todayStart }, status: 'completed' },
    });

    // Monthly revenue
    const monthlyRevenue =
      (await Donation.sum('amount', {
        where: { date: { [Op.gte]: monthStart }, status: 'completed' },
      })) || 0;

    const lastMonthRevenue =
      (await Donation.sum('amount', {
        where: {
          date: { [Op.gte]: lastMonthStart, [Op.lt]: monthStart },
          status: 'completed',
        },
      })) || 0;

    // Pending payouts
    const pendingPayouts =
      (await Donation.sum('amount', {
        where: { status: 'pending' },
      })) || 0;

    const pendingPayoutCount = await Donation.count({
      where: { status: 'pending' },
    });

    // Platform fees (10% rate as shown in design)
    const platformFeeRate = 0.1;
    const platformFees = Math.round(monthlyRevenue * platformFeeRate * 100) / 100;

    return {
      todayDonations: {
        value: todayDonations,
        transactions: todayDonationCount,
        change: null, // daily comparison not always meaningful
      },
      monthlyRevenue: {
        value: monthlyRevenue,
        change: this.calcPercentageChange(monthlyRevenue, lastMonthRevenue),
        previousValue: lastMonthRevenue,
      },
      pendingPayouts: {
        value: pendingPayouts,
        count: pendingPayoutCount,
      },
      platformFees: {
        value: platformFees,
        rate: `${platformFeeRate * 100}%`,
      },
    };
  }

  // ============================================================
  // 7. RECENT ACTIVITY FEED
  //    (New authors, articles published, donations, flagged content, logins)
  // ============================================================

  async getRecentActivity(limit: number = 20) {
    // Pull from the Log model which already captures activity via hooks
    const logs = await Log.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });

    // Also get recent moderation actions
    const recentModerations = await ModerationLog.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: Contribution,
          attributes: ['id', 'title'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // Combine and format
    const activities = [
      ...logs.map((log) => ({
        id: log.id,
        type: this.mapLogToActivityType(log.action, log.entity_type),
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        user: log.user
          ? {
              id: log.user.id,
              name: log.user.full_name || log.user.username,
            }
          : null,
        timestamp: log.createdAt,
        details: log.details ? this.safeJsonParse(log.details) : null,
      })),
      ...recentModerations.map((mod) => ({
        id: mod.id,
        type: 'moderation',
        action: mod.action,
        entityType: 'Contribution',
        entityId: mod.contribution_id,
        user: mod.reviewer
          ? {
              id: mod.reviewer.id,
              name: mod.reviewer.full_name || mod.reviewer.username,
            }
          : null,
        timestamp: mod.created_at,
        details: {
          reason: mod.reason,
          contributionTitle: mod.contribution?.title,
        },
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);

    return { activities };
  }

  private mapLogToActivityType(action: string, entityType: string): string {
    if (entityType === 'User' && action === 'CREATE') return 'new_user';
    if (entityType === 'Contribution' && action === 'CREATE')
      return 'content_published';
    if (entityType === 'Contribution' && action === 'UPDATE')
      return 'content_updated';
    if (action === 'DELETE') return 'content_deleted';
    return 'general';
  }

  private safeJsonParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // ============================================================
  // 8. USERS MANAGEMENT (Enhanced)
  //    (Search, filter by role/status, with contributions count)
  // ============================================================

  async getUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${filters.search}%` } },
        { full_name: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const include: any[] = [
      {
        model: UserRole,
        include: [
          {
            model: Role,
            as: 'role',
            where: filters.role ? { name: filters.role } : undefined,
          },
        ],
      },
      {
        model: UserProfile,
        attributes: ['avatar', 'display_name'],
      },
    ];

    const { rows, count } = await User.findAndCountAll({
      where,
      include,
      attributes: {
        include: [
          [
            literal(
              `(SELECT COUNT(*) FROM contributions WHERE contributions.user_id = "User".id)`,
            ),
            'contributionsCount',
          ],
        ],
        exclude: ['password'],
      },
      limit: filters.limit,
      offset: filters.offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit,
    };
  }

  // ============================================================
  // 9. CONTENT LIBRARY
  //    (All contributions with filters, for Content Library dashboard)
  // ============================================================

  async getContentLibrary(filters: {
    type?: string;
    status?: string;
    search?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const include: any[] = [
      {
        model: ContributionType,
        where: filters.type ? { name: filters.type } : undefined,
      },
      {
        model: User,
        attributes: ['id', 'username', 'full_name'],
      },
      {
        model: File,
        attributes: ['id', 'file_name', 'mime_type', 'file_size'],
      },
    ];

    const { rows, count } = await Contribution.findAndCountAll({
      where,
      include,
      limit: filters.limit,
      offset: filters.offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit,
    };
  }

  // ============================================================
  // 10. ENGAGEMENT STATS
  //     (Total comments, likes, active discussions, badges)
  // ============================================================

  async getEngagementStats() {
    const [totalComments, totalReactions, activeDiscussions] =
      await Promise.all([
        Comment.count(),
        Reaction.count(),
        Discussion.count(),
      ]);

    // Likes specifically
    const totalLikes = await Reaction.count({
      where: { type: 'like' },
    });

    return {
      totalComments,
      totalLikes,
      totalReactions,
      activeDiscussions,
      badgesAwarded: 0, // placeholder until badges model exists
    };
  }

  // ============================================================
  // 11. ENGAGEMENT — Comments list
  //     (Paginated comments with search and flagged filter)
  // ============================================================

  async getEngagementComments(filters: {
    search?: string;
    flagged?: boolean;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (filters.search) {
      where.content = { [Op.iLike]: `%${filters.search}%` };
    }

    const { rows, count } = await Comment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: Discussion,
          attributes: ['id', 'title'],
        },
      ],
      limit: filters.limit,
      offset: filters.offset,
      order: [['createdAt', 'DESC']],
    });

    // Get reaction counts for each comment
    const commentIds = rows.map((c) => c.id);
    const reactionCounts = await Reaction.findAll({
      attributes: [
        'comment_id',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { comment_id: { [Op.in]: commentIds } },
      group: ['comment_id'],
    });

    const reactionMap = new Map(
      reactionCounts.map((r: any) => [r.comment_id, parseInt(r.get('count'))]),
    );

    const data = rows.map((comment) => ({
      ...comment.toJSON(),
      reactionCount: reactionMap.get(comment.id) || 0,
    }));

    return {
      data,
      total: count,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit,
    };
  }

  // ============================================================
  // 12. FINANCE — Donations list
  //     (Paginated donations: donor, recipient, amount, date, status)
  // ============================================================

  async getFinanceDonations(filters: {
    status?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const { rows, count } = await Donation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      limit: filters.limit,
      offset: filters.offset,
      order: [['date', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit,
    };
  }

  // ============================================================
  // 13. REPORTS & MODERATION STATS
  //     (Pending reports, content flagged, users reported, resolved today)
  // ============================================================

  async getModerationStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pendingReports, contentFlagged, resolvedToday] = await Promise.all([
      ModerationLog.count({ where: { action: 'flagged' } }),
      Contribution.count({ where: { status: 'flagged' } }),
      ModerationLog.count({
        where: {
          action: { [Op.in]: ['approved', 'rejected'] },
          created_at: { [Op.gte]: todayStart },
        },
      }),
    ]);

    return {
      pendingReports,
      contentFlagged,
      usersReported: 0, // placeholder — needs a user reports model
      resolvedToday,
    };
  }

  // ============================================================
  // 14. MODERATION — Reported content list
  // ============================================================

  async getModerationReports(filters: {
    status?: string;
    search?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (filters.status) where.action = filters.status;

    const { rows, count } = await ModerationLog.findAndCountAll({
      where,
      include: [
        {
          model: Contribution,
          attributes: ['id', 'title', 'status', 'user_id'],
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'full_name'],
            },
          ],
        },
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      limit: filters.limit,
      offset: filters.offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit,
    };
  }

  // ============================================================
  // 15. MODERATION — Audit Log
  // ============================================================

  async getAuditLog(filters: { limit: number; offset: number }) {
    const { rows, count } = await AuditTrail.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      limit: filters.limit,
      offset: filters.offset,
      order: [['timestamp', 'DESC']],
    });

    return {
      data: rows.map((trail) => ({
        ...trail.toJSON(),
        changes: this.safeJsonParse(trail.changes),
      })),
      total: count,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit,
    };
  }

  // ============================================================
  // 16. OPEN CALLS OVERVIEW
  // ============================================================

  async getOpenCallsOverview() {
    const [totalOpenCalls, activeOpenCalls, totalParticipants] =
      await Promise.all([
        OpenCall.count(),
        OpenCall.count({ where: { status: 'open' } }),
        Participant.count(),
      ]);

    const recentOpenCalls = await OpenCall.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: Participant,
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return {
      totalOpenCalls,
      activeOpenCalls,
      totalParticipants,
      recent: recentOpenCalls.map((oc) => ({
        id: oc.id,
        title: oc.title,
        status: oc.status,
        category: oc.category,
        participantCount: oc.participants?.length || 0,
        creator: oc.creator
          ? { id: oc.creator.id, name: oc.creator.full_name || oc.creator.username }
          : null,
        timelineStart: oc.timeline_start,
        timelineEnd: oc.timeline_end,
      })),
    };
  }

  // ============================================================
  // 17. COLLECTIONS OVERVIEW
  // ============================================================

  async getCollectionsOverview() {
    const totalCollections = await Collection.count();

    const recentCollections = await Collection.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['created_date', 'DESC']],
      limit: 5,
    });

    return {
      totalCollections,
      recent: recentCollections,
    };
  }

  // ============================================================
  // 18. ANALYTICS — Platform Growth
  //     (User registrations over time)
  // ============================================================

  async getAnalyticsPlatformGrowth(period: string = '30d') {
    const { start } = this.getDateRange(period);

    const results = await User.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.gte]: start },
      },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    return { data: results, period };
  }

  // ============================================================
  // 19. ANALYTICS — Content Performance
  // ============================================================

  async getAnalyticsContentPerformance(period: string = '30d') {
    const { start } = this.getDateRange(period);

    const results = await Contribution.findAll({
      attributes: [
        [fn('DATE', col('submission_date')), 'date'],
        [fn('COUNT', col('Contribution.id')), 'count'],
      ],
      where: {
        submission_date: { [Op.gte]: start },
        status: 'published',
      },
      group: [fn('DATE', col('submission_date'))],
      order: [[fn('DATE', col('submission_date')), 'ASC']],
      raw: true,
    });

    // Top contributors
    const topContributors = await Contribution.findAll({
      attributes: [
        'user_id',
        [fn('COUNT', col('Contribution.id')), 'count'],
      ],
      where: {
        submission_date: { [Op.gte]: start },
        status: 'published',
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      group: ['user_id', 'user.id', 'user.username', 'user.full_name'],
      order: [[fn('COUNT', col('Contribution.id')), 'DESC']],
      limit: 10,
      raw: false,
    });

    return {
      timeline: results,
      topContributors: topContributors.map((c: any) => ({
        user: c.user
          ? { id: c.user.id, name: c.user.full_name || c.user.username }
          : null,
        count: parseInt(c.get('count')),
      })),
      period,
    };
  }

  // ============================================================
  // 20. FULL DASHBOARD SUMMARY (combines key data for single call)
  // ============================================================

  async getFullDashboard() {
    const [
      stats,
      alerts,
      contentOverview,
      usersByRole,
      financeSnapshot,
      recentActivity,
    ] = await Promise.all([
      this.getStats(),
      this.getAlerts(),
      this.getContentOverview(),
      this.getUsersByRole(),
      this.getFinanceSnapshot(),
      this.getRecentActivity(10),
    ]);

    return {
      stats,
      alerts,
      contentOverview,
      usersByRole,
      financeSnapshot,
      recentActivity,
    };
  }
}