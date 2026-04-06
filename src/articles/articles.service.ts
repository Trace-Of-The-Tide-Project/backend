import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseService } from '../common/base.service';
import { Article } from './models/article.model';
import { ArticleBlock } from './models/article-block.model';
import { ArticleContributor } from './models/article-contributor.model';
import { ArticleTag } from './models/article-tag.model';
import { User } from '../users/models/user.model';
import { UserProfile } from '../users/models/user-profile.model';
import { Tag } from '../tags/models/tag.model';
import { Collection } from '../collections/models/collection.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Op } from 'sequelize';

@Injectable()
export class ArticlesService extends BaseService<Article> {
  private readonly logger = new Logger(ArticlesService.name);
  private readonly defaultInclude = [
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'full_name'],
      include: [
        {
          model: UserProfile,
          attributes: ['avatar', 'social_links', 'display_name'],
        },
      ],
    },
    {
      model: ArticleBlock,
      separate: true,
      order: [['block_order', 'ASC']] as any,
    },
    {
      model: ArticleContributor,
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
    },
    { model: Tag, through: { attributes: [] } },
    { model: Collection, attributes: ['id', 'name'], required: false },
    { model: OpenCall, attributes: ['id', 'title'], required: false },
    {
      model: Article,
      as: 'translations',
      attributes: ['id', 'title', 'language', 'slug'],
      required: false,
    },
  ];

  constructor(
    @InjectModel(Article) private readonly articleModel: typeof Article,
    @InjectModel(ArticleBlock) private readonly blockModel: typeof ArticleBlock,
    @InjectModel(ArticleContributor)
    private readonly contributorModel: typeof ArticleContributor,
    @InjectModel(ArticleTag)
    private readonly articleTagModel: typeof ArticleTag,
  ) {
    super(articleModel);
  }

  // ─── SLUG GENERATOR ───────────────────────────────────────

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // keep arabic chars
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 120);
  }

  private async ensureUniqueSlug(
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    let candidate = slug;
    let counter = 1;
    while (true) {
      const where: any = { slug: candidate };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const existing = await this.articleModel.findOne({ where });
      if (!existing) return candidate;
      candidate = `${slug}-${counter++}`;
    }
  }

  // ─── ARTICLES CRUD ────────────────────────────────────────

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'excerpt', 'category'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findBySlug(slug: string) {
    const article = await this.articleModel.findOne({
      where: { slug },
      include: this.defaultInclude,
    });
    if (!article) throw new NotFoundException(`Article not found`);
    return article;
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async createArticle(data: any, authorId: string) {
    const { tag_ids, blocks, ...articleData } = data;

    // Generate slug
    const baseSlug = this.generateSlug(articleData.title);
    articleData.slug = await this.ensureUniqueSlug(baseSlug);
    articleData.author_id = authorId;

    // Calculate reading time from blocks
    if (blocks?.length) {
      const wordCount = blocks
        .filter((b: any) => b.content)
        .reduce(
          (sum: number, b: any) => sum + b.content.split(/\s+/).length,
          0,
        );
      articleData.reading_time = Math.max(1, Math.ceil(wordCount / 200));
    }

    const article = await this.articleModel.create(articleData);

    // Create blocks
    if (blocks?.length) {
      for (const block of blocks) {
        await this.blockModel.create({
          ...block,
          article_id: article.id,
        });
      }
    }

    // Associate tags
    if (tag_ids?.length) {
      for (const tagId of tag_ids) {
        await this.articleTagModel.findOrCreate({
          where: { article_id: article.id, tag_id: tagId },
          defaults: { article_id: article.id, tag_id: tagId } as any,
        });
      }
    }

    return this.findOne(article.id);
  }

  async updateArticle(
    id: string,
    data: any,
    userId: string,
    userRoles: string[] = [],
  ) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    // Admin can edit any article; others can only edit their own
    const isAdmin = userRoles.includes('admin');
    if (!isAdmin && article.author_id !== userId) {
      throw new ForbiddenException('Only the author or admin can edit this article');
    }

    const { tag_ids, blocks, ...articleData } = data;

    // Regenerate slug if title changed
    if (articleData.title && articleData.title !== article.title) {
      const baseSlug = this.generateSlug(articleData.title);
      articleData.slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    await article.update(articleData);

    // Replace tags if provided
    if (tag_ids !== undefined) {
      await this.articleTagModel.destroy({ where: { article_id: id } });
      for (const tagId of tag_ids) {
        await this.articleTagModel.create({
          article_id: id,
          tag_id: tagId,
        } as any);
      }
    }

    // Replace blocks if provided
    if (blocks !== undefined) {
      await this.blockModel.destroy({ where: { article_id: id } });
      for (const block of blocks) {
        await this.blockModel.create({ ...block, article_id: id });
      }
      // Recalculate reading time
      const wordCount = blocks
        .filter((b: any) => b.content)
        .reduce(
          (sum: number, b: any) => sum + b.content.split(/\s+/).length,
          0,
        );
      await article.update({
        reading_time: Math.max(1, Math.ceil(wordCount / 200)),
      });
    }

    return this.findOne(id);
  }

  // ─── PUBLISHING WORKFLOW ──────────────────────────────────

  async publishArticle(id: string) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    if (!['draft', 'scheduled'].includes(article.status)) {
      throw new BadRequestException(
        `Cannot publish a ${article.status} article`,
      );
    }

    // Must have at least one block
    const blockCount = await this.blockModel.count({
      where: { article_id: id },
    });
    if (blockCount === 0) {
      throw new BadRequestException('Add content blocks before publishing');
    }

    // Recalculate reading time on publish
    const blocks = await this.blockModel.findAll({ where: { article_id: id } });
    const wordCount = blocks
      .filter((b) => b.content)
      .reduce((sum, b) => sum + b.content.split(/\s+/).length, 0);
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    await article.update({
      status: 'published',
      published_at: new Date(),
      reading_time: readingTime,
    });
    return article;
  }

  async scheduleArticle(id: string, scheduledAt: string) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      throw new BadRequestException('Schedule date must be in the future');
    }

    await article.update({ status: 'scheduled', scheduled_at: scheduleDate });
    return article;
  }

  async archiveArticle(id: string) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    await article.update({ status: 'archived' });
    return article;
  }

  async unpublishArticle(id: string) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    await article.update({ status: 'draft', published_at: undefined });
    return article;
  }

  // ─── VIEW TRACKING ────────────────────────────────────────

  async incrementView(id: string) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    await article.increment('view_count');
    await article.reload();
    return { view_count: article.view_count };
  }

  // ─── BLOCKS MANAGEMENT ────────────────────────────────────

  async getBlocks(articleId: string) {
    await this.findOne(articleId);
    return this.blockModel.findAll({
      where: { article_id: articleId },
      order: [['block_order', 'ASC']],
    });
  }

  async addBlock(articleId: string, data: any) {
    const article = await this.articleModel.findByPk(articleId);
    if (!article) throw new NotFoundException(`Article ${articleId} not found`);
    return this.blockModel.create({ ...data, article_id: articleId });
  }

  async updateBlock(articleId: string, blockId: string, data: any) {
    const block = await this.blockModel.findOne({
      where: { id: blockId, article_id: articleId },
    });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    await block.update(data);
    return block;
  }

  async removeBlock(articleId: string, blockId: string) {
    const block = await this.blockModel.findOne({
      where: { id: blockId, article_id: articleId },
    });
    if (!block) throw new NotFoundException(`Block ${blockId} not found`);
    await block.destroy();
    return { message: 'Block removed' };
  }

  async reorderBlocks(articleId: string, blockIds: string[]) {
    await this.findOne(articleId);
    for (let i = 0; i < blockIds.length; i++) {
      await this.blockModel.update(
        { block_order: i + 1 },
        { where: { id: blockIds[i], article_id: articleId } },
      );
    }
    return this.getBlocks(articleId);
  }

  // ─── CONTRIBUTORS ─────────────────────────────────────────

  async getContributors(articleId: string) {
    await this.findOne(articleId);
    return this.contributorModel.findAll({
      where: { article_id: articleId },
      include: [{ model: User, attributes: ['id', 'username', 'full_name'] }],
    });
  }

  async addContributor(articleId: string, data: any) {
    const article = await this.articleModel.findByPk(articleId);
    if (!article) throw new NotFoundException(`Article ${articleId} not found`);

    const existing = await this.contributorModel.findOne({
      where: { article_id: articleId, user_id: data.user_id },
    });
    if (existing)
      throw new BadRequestException('User is already a contributor');

    return this.contributorModel.create({
      article_id: articleId,
      user_id: data.user_id,
      role: data.role || 'contributor',
      added_at: new Date(),
    } as any);
  }

  async removeContributor(articleId: string, contributorId: string) {
    const contributor = await this.contributorModel.findOne({
      where: { id: contributorId, article_id: articleId },
    });
    if (!contributor) throw new NotFoundException('Contributor not found');
    await contributor.destroy();
    return { message: 'Contributor removed' };
  }

  // ─── RELATED ARTICLES ──────────────────────────────────────

  async getRelatedArticles(id: string) {
    const article = await this.articleModel.findByPk(id, {
      include: [{ model: Tag, through: { attributes: [] } }],
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    const tagIds = article.tags?.map((t) => t.id) || [];

    // Find articles that share the same category or tags
    const where: any = {
      id: { [Op.ne]: id },
      status: 'published',
      [Op.or]: [] as any[],
    };

    if (article.category) {
      where[Op.or].push({ category: article.category });
    }

    // If no filters available, just get recent published articles
    if (where[Op.or].length === 0) {
      delete where[Op.or];
    }

    let relatedArticles = await this.articleModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name'],
        },
        { model: Tag, through: { attributes: [] } },
      ],
      order: [['published_at', 'DESC']],
      limit: 4,
    });

    // If we have tag IDs, boost articles that share tags
    if (tagIds.length > 0 && relatedArticles.length < 4) {
      const tagRelated = await this.articleModel.findAll({
        where: {
          id: { [Op.ne]: id, [Op.notIn]: relatedArticles.map((a) => a.id) },
          status: 'published',
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'full_name'],
          },
          {
            model: Tag,
            through: { attributes: [] },
            where: { id: { [Op.in]: tagIds } },
            required: true,
          },
        ],
        limit: 4 - relatedArticles.length,
      });
      relatedArticles = [...relatedArticles, ...tagRelated];
    }

    return relatedArticles;
  }

  // ─── TRANSLATIONS ────────────────────────────────────────

  async getTranslations(id: string) {
    const article = await this.articleModel.findByPk(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    // If this article is itself a translation, resolve to the original
    const originalId = article.translation_of || article.id;

    const original = await this.articleModel.findByPk(originalId, {
      attributes: ['id', 'title', 'language', 'slug'],
    });

    const translations = await this.articleModel.findAll({
      where: { translation_of: originalId },
      attributes: ['id', 'title', 'language', 'slug'],
    });

    return { original, translations };
  }

  // ─── AUTHOR-SPECIFIC QUERIES ──────────────────────────────

  async findByAuthor(authorId: string, query: any = {}) {
    return this.articleModel.findAndCountAll({
      where: {
        author_id: authorId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: [
        { model: Tag, through: { attributes: [] } },
        { model: ArticleContributor, attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: query.limit || 20,
      offset: query.offset || 0,
    });
  }

  async getAuthorStats(authorId: string) {
    const totalArticles = await this.articleModel.count({
      where: { author_id: authorId },
    });
    const published = await this.articleModel.count({
      where: { author_id: authorId, status: 'published' },
    });
    const drafts = await this.articleModel.count({
      where: { author_id: authorId, status: 'draft' },
    });
    const totalViews =
      (await this.articleModel.sum('view_count', {
        where: { author_id: authorId },
      })) || 0;

    return {
      total_articles: totalArticles,
      published,
      drafts,
      total_views: totalViews,
    };
  }

  // ─── COLLECTION ARTICLES ────────────────────────────────────

  async getCollectionArticles(collectionId: string) {
    const articles = await this.articleModel.findAll({
      where: { collection_id: collectionId, status: 'published' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      attributes: [
        'id',
        'title',
        'slug',
        'cover_image',
        'content_type',
        'reading_time',
        'media_duration',
        'edition',
        'published_at',
      ],
      order: [['published_at', 'ASC']],
    });

    const totalMinutes = articles.reduce((sum, a) => {
      return sum + (a.media_duration || a.reading_time || 0);
    }, 0);

    return {
      count: articles.length,
      total_hours: +(totalMinutes / 60).toFixed(1),
      articles,
    };
  }

  // ─── SCHEDULED PUBLISHING CRON ──────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledArticles() {
    const now = new Date();
    const articles = await this.articleModel.findAll({
      where: {
        status: 'scheduled',
        scheduled_at: { [Op.lte]: now },
      },
    });

    for (const article of articles) {
      await article.update({
        status: 'published',
        published_at: now,
      });
      this.logger.log(`Auto-published scheduled article: ${article.id}`);
    }
  }
}
