import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { Article } from '../articles/models/article.model';
import { ArticleContributor } from '../articles/models/article-contributor.model';
import { ArticleViewSnapshot } from './models/article-view-snapshot.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Donation } from '../donations/models/donation.model';
import { Trip } from '../trips/models/trip.model';
import { TripParticipant } from '../trips/models/trip-participant.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Comment } from '../comments/models/comment.model';
import { Reaction } from '../reactions/models/reaction.model';
import { Collection } from '../collections/models/collection.model';
import { Sequelize, Op, fn, col, literal } from 'sequelize';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(Article) private readonly articleModel: typeof Article,
    @InjectModel(ArticleContributor)
    private readonly articleContributorModel: typeof ArticleContributor,
    @InjectModel(ArticleViewSnapshot)
    private readonly articleViewSnapshotModel: typeof ArticleViewSnapshot,
    @InjectModel(Contribution)
    private readonly contributionModel: typeof Contribution,
    @InjectModel(Donation) private readonly donationModel: typeof Donation,
    @InjectModel(Trip) private readonly tripModel: typeof Trip,
    @InjectModel(TripParticipant)
    private readonly tripParticipantModel: typeof TripParticipant,
    @InjectModel(OpenCall) private readonly openCallModel: typeof OpenCall,
    @InjectModel(Participant)
    private readonly participantModel: typeof Participant,
    @InjectModel(Discussion)
    private readonly discussionModel: typeof Discussion,
    @InjectModel(Comment) private readonly commentModel: typeof Comment,
    @InjectModel(Reaction) private readonly reactionModel: typeof Reaction,
    @InjectModel(Collection)
    private readonly collectionModel: typeof Collection,
  ) {}

  // ─── HELPER: date range filter ────────────────────────────

  private getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    return { start, end };
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 1: OVERVIEW
  // ═══════════════════════════════════════════════════════════

  async getOverview(period: string = '30d') {
    const { start, end } = this.getDateRange(period);
    const prevStart = new Date(start);
    prevStart.setTime(prevStart.getTime() - (end.getTime() - start.getTime()));

    // Days since first user registered (platform age)
    const firstUserRow = (await this.userModel.findOne({
      attributes: [[fn('MIN', col('createdAt')), 'first_at']],
      raw: true,
    })) as unknown as { first_at: string | null };
    const daysActive = firstUserRow?.first_at
      ? Math.floor(
          (Date.now() - new Date(firstUserRow.first_at).getTime()) / 86_400_000,
        )
      : 0;

    // Current period stats
    const totalPageViews = (await this.articleModel.sum('view_count')) || 0;
    const totalUsers = await this.userModel.count();
    const newUsersThisPeriod = await this.userModel.count({
      where: { createdAt: { [Op.between]: [start, end] } },
    });
    const newUsersPrevPeriod = await this.userModel.count({
      where: { createdAt: { [Op.between]: [prevStart, start] } },
    });

    const totalArticles = await this.articleModel.count();
    const publishedArticles = await this.articleModel.count({
      where: { status: 'published' },
    });

    const totalContributions = await this.contributionModel.count();
    const newContributions = await this.contributionModel.count({
      where: { createdAt: { [Op.between]: [start, end] } },
    });

    // Growth chart data — user registrations grouped by day
    const userGrowth = await this.userModel.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { createdAt: { [Op.between]: [start, end] } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    // Engagement trends — articles created per day
    const contentGrowth = await this.articleModel.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { createdAt: { [Op.between]: [start, end] } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    return {
      summary: {
        total_page_views: totalPageViews,
        total_users: totalUsers,
        new_users: newUsersThisPeriod,
        user_growth_pct:
          newUsersPrevPeriod > 0
            ? Math.round(
                ((newUsersThisPeriod - newUsersPrevPeriod) /
                  newUsersPrevPeriod) *
                  100,
              )
            : 0,
        total_articles: totalArticles,
        published_articles: publishedArticles,
        total_contributions: totalContributions,
        new_contributions: newContributions,
        days_active: daysActive,
      },
      charts: {
        user_growth: userGrowth,
        content_growth: contentGrowth,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 2: CONTENT PERFORMANCE
  // ═══════════════════════════════════════════════════════════

  async getContentPerformance(period: string = '30d') {
    const { start, end } = this.getDateRange(period);

    // Top categories by total views
    const topCategories = await this.articleModel.findAll({
      attributes: [
        'category',
        [fn('SUM', col('view_count')), 'total_views'],
        [fn('COUNT', col('id')), 'article_count'],
      ],
      where: {
        category: { [Op.ne]: null as any },
        status: 'published',
      },
      group: ['category'],
      order: [[fn('SUM', col('view_count')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Top articles by views
    const topArticles = await this.articleModel.findAll({
      attributes: [
        'id',
        'title',
        'slug',
        'category',
        'view_count',
        'published_at',
      ],
      where: { status: 'published' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['view_count', 'DESC']],
      limit: 10,
    });

    const ids = topArticles.map((a) => a.id);

    // ── Contributor counts per article ──────────────────────────
    type ContributorCountRow = { article_id: string; contributor_count: string };
    const contributorRows: ContributorCountRow[] = ids.length
      ? ((await this.articleContributorModel.findAll({
          attributes: [
            'article_id',
            [fn('COUNT', col('user_id')), 'contributor_count'],
          ],
          where: { article_id: { [Op.in]: ids } },
          group: ['article_id'],
          raw: true,
        })) as unknown as ContributorCountRow[])
      : [];

    const contributorMap: Record<string, number> = Object.fromEntries(
      contributorRows.map((r) => [r.article_id, parseInt(r.contributor_count, 10)]),
    );

    // ── Trend % per article ─────────────────────────────────────
    // Find the most recent snapshot for each article taken BEFORE the current
    // period started — that represents "views at the start of this period".
    // Trend = (current_view_count − snapshot_view_count) / snapshot_view_count × 100
    type SnapshotRow = { article_id: string; view_count: number; createdAt: string };
    const snapshotRows: SnapshotRow[] = ids.length
      ? ((await this.articleViewSnapshotModel.findAll({
          where: {
            article_id: { [Op.in]: ids },
            period,
            createdAt: { [Op.lte]: start },
          },
          order: [['createdAt', 'DESC']],
          raw: true,
        })) as unknown as SnapshotRow[])
      : [];

    // Most recent snapshot per article (descending order means first hit wins)
    const snapshotMap: Record<string, number> = {};
    for (const row of snapshotRows) {
      if (!(row.article_id in snapshotMap)) {
        snapshotMap[row.article_id] = row.view_count;
      }
    }

    // Enrich top articles with contributor_count and trend_pct
    const enrichedTopArticles = topArticles.map((article) => {
      const plain = article.toJSON() as unknown as Record<string, unknown>;
      const currentViews = article.view_count;
      const prevViews = snapshotMap[article.id];

      let trend_pct: number | null = null;
      if (prevViews !== undefined) {
        if (prevViews > 0) {
          trend_pct = Math.round(((currentViews - prevViews) / prevViews) * 100);
        } else {
          trend_pct = currentViews > 0 ? 100 : 0;
        }
      }

      return {
        ...plain,
        contributor_count: contributorMap[article.id] ?? 0,
        trend_pct,
      };
    });

    // Save snapshots (at most once per article/period per day)
    if (ids.length) {
      const oneDayAgo = new Date(Date.now() - 86_400_000);
      type RecentRow = { article_id: string };
      const recentRows: RecentRow[] = (await this.articleViewSnapshotModel.findAll({
        attributes: ['article_id'],
        where: {
          article_id: { [Op.in]: ids },
          period,
          createdAt: { [Op.gte]: oneDayAgo },
        },
        raw: true,
      })) as unknown as RecentRow[];

      const recentlySnapshotted = new Set(recentRows.map((r) => r.article_id));
      const toSnapshot = topArticles.filter((a) => !recentlySnapshotted.has(a.id));

      if (toSnapshot.length) {
        await this.articleViewSnapshotModel.bulkCreate(
          toSnapshot.map((a) => ({
            article_id: a.id,
            period,
            view_count: a.view_count,
          })) as any,
        );
      }
    }

    // Content type distribution
    const contentTypeDistribution = await this.articleModel.findAll({
      attributes: ['content_type', [fn('COUNT', col('id')), 'count']],
      group: ['content_type'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true,
    });

    // Status distribution
    const statusDistribution = await this.articleModel.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    return {
      top_categories: topCategories,
      top_articles: enrichedTopArticles,
      content_type_distribution: contentTypeDistribution,
      status_distribution: statusDistribution,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3: TOP CREATORS
  // ═══════════════════════════════════════════════════════════

  async getTopCreators(period: string = '30d', limit: number = 10) {
    // Top authors by article count + total views
    const topAuthors = await this.articleModel.findAll({
      attributes: [
        'author_id',
        [fn('COUNT', col('Article.id')), 'article_count'],
        [fn('SUM', col('view_count')), 'total_views'],
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      where: { status: 'published' },
      group: ['author_id', 'author.id', 'author.username', 'author.full_name'],
      order: [[fn('SUM', col('view_count')), 'DESC']],
      limit,
    });

    // Top contributors by contribution count
    const topContributors = await this.contributionModel.findAll({
      attributes: [
        'user_id',
        [fn('COUNT', col('Contribution.id')), 'contribution_count'],
      ],
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
      group: ['user_id', 'User.id', 'User.username', 'User.full_name'],
      order: [[fn('COUNT', col('Contribution.id')), 'DESC']],
      limit,
    });

    // Authors with most donations received (earnings)
    const topEarners = await this.donationModel.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'total_earnings'],
        [fn('COUNT', col('Donation.id')), 'donation_count'],
      ],
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
      group: ['User.id', 'User.username', 'User.full_name'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      limit,
    });

    return {
      top_authors: topAuthors,
      top_contributors: topContributors,
      top_earners: topEarners,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4: CONVERSION FUNNEL
  // ═══════════════════════════════════════════════════════════

  async getConversionFunnel() {
    const totalUsers = await this.userModel.count();

    // Count users by role
    const roleCounts: Record<string, number> = {};
    const roles = await this.roleModel.findAll({ attributes: ['id', 'name'] });

    for (const role of roles) {
      roleCounts[role.name] = await this.userRoleModel.count({
        where: { role_id: role.id },
      });
    }

    // Users who made at least 1 contribution
    const contributorCount = await this.contributionModel.count({
      distinct: true,
      col: 'user_id',
    });

    // Users who published at least 1 article
    const authorCount = await this.articleModel.count({
      distinct: true,
      col: 'author_id',
      where: { status: 'published' },
    });

    const funnel = [
      { stage: 'Registered Users', count: totalUsers, conversion: 100 },
      {
        stage: 'Contributors',
        count: contributorCount,
        conversion:
          totalUsers > 0
            ? Math.round((contributorCount / totalUsers) * 1000) / 10
            : 0,
      },
      {
        stage: 'Authors',
        count: authorCount,
        conversion:
          contributorCount > 0
            ? Math.round((authorCount / contributorCount) * 1000) / 10
            : 0,
      },
      {
        stage: 'Editors',
        count: roleCounts['editor'] || 0,
        conversion:
          authorCount > 0
            ? Math.round(((roleCounts['editor'] || 0) / authorCount) * 1000) /
              10
            : 0,
      },
      {
        stage: 'Admins',
        count: roleCounts['admin'] || 0,
        conversion: 0,
      },
    ];

    return { funnel, role_distribution: roleCounts };
  }

  // ═══════════════════════════════════════════════════════════
  // PLATFORM SUMMARY (for main dashboard cards)
  // ═══════════════════════════════════════════════════════════

  async getPlatformSummary() {
    const [
      totalUsers,
      totalArticles,
      totalContributions,
      totalCollections,
      totalTrips,
      totalOpenCalls,
      totalDiscussions,
      totalComments,
      totalReactions,
      totalDonations,
      donationSum,
    ] = await Promise.all([
      this.userModel.count(),
      this.articleModel.count(),
      this.contributionModel.count(),
      this.collectionModel.count(),
      this.tripModel.count(),
      this.openCallModel.count(),
      this.discussionModel.count(),
      this.commentModel.count(),
      this.reactionModel.count(),
      this.donationModel.count(),
      this.donationModel.sum('amount'),
    ]);

    return {
      users: totalUsers,
      articles: totalArticles,
      contributions: totalContributions,
      collections: totalCollections,
      trips: totalTrips,
      open_calls: totalOpenCalls,
      discussions: totalDiscussions,
      comments: totalComments,
      reactions: totalReactions,
      donations: { count: totalDonations, total_amount: donationSum || 0 },
    };
  }
}
