import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ContributionType } from '../contributions/models/contribution-type.model';
import { Tag } from '../tags/models/tag.model';
import { Badge } from './models/badge.model';
import { EmailTemplate } from './models/email-template.model';
import { SiteSettings } from '../cms/models/site-settings.model';
import { Contribution } from '../contributions/models/contribution.model';
import { ContributionTag } from '../tags/models/contribution-tag.model';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectModel(ContributionType) private contributionTypeModel: typeof ContributionType,
    @InjectModel(Tag) private tagModel: typeof Tag,
    @InjectModel(Badge) private badgeModel: typeof Badge,
    @InjectModel(EmailTemplate) private emailTemplateModel: typeof EmailTemplate,
    @InjectModel(SiteSettings) private siteSettingsModel: typeof SiteSettings,
    @InjectModel(Contribution) private contributionModel: typeof Contribution,
    @InjectModel(ContributionTag) private contributionTagModel: typeof ContributionTag,
  ) {}

  // ═══════════════════════════════════════════════
  // TAB 1: CATEGORIES (Content Categories)
  // ═══════════════════════════════════════════════

  async getCategories() {
    const categories = await this.contributionTypeModel.findAll({
      order: [['createdAt', 'ASC']],
    });

    const result = await Promise.all(
      categories.map(async (cat: any) => {
        // FIX: Contribution uses type_id FK, not a 'type' string field
        const itemCount = await this.contributionModel.count({
          where: { type_id: cat.id },
        });
        return {
          id: cat.id,
          name: cat.name,
          // FIX: ContributionType has no slug column — generate it on the fly
          slug: this.generateSlug(cat.name),
          description: cat.description,
          item_count: itemCount,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        };
      }),
    );

    return { categories: result, total: result.length };
  }

  async createCategory(dto: { name: string; slug?: string; description?: string }) {
    const existing = await this.contributionTypeModel.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    // FIX: ContributionType only has name + description, no slug column
    const category = await this.contributionTypeModel.create({
      name: dto.name,
      description: dto.description || '',
    } as any);

    return {
      message: 'Category created successfully',
      category: {
        ...(category as any).toJSON(),
        slug: this.generateSlug(dto.name),
      },
    };
  }

  async updateCategory(id: string, dto: { name?: string; slug?: string; description?: string }) {
    const category = await this.contributionTypeModel.findByPk(id);
    if (!category) throw new NotFoundException('Category not found');

    if (dto.name) {
      const existing = await this.contributionTypeModel.findOne({
        where: { name: dto.name },
      });
      if (existing && (existing as any).id !== id) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
    }

    // FIX: Only update name and description (no slug column)
    await category.update({
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
    });

    return { message: 'Category updated successfully', category };
  }

  async deleteCategory(id: string) {
    const category = await this.contributionTypeModel.findByPk(id);
    if (!category) throw new NotFoundException('Category not found');

    // FIX: Use type_id FK instead of type string match
    const itemCount = await this.contributionModel.count({
      where: { type_id: id },
    });

    if (itemCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${itemCount} items. Reassign items first.`,
      );
    }

    await category.destroy();
    return { message: 'Category deleted successfully' };
  }

  // ═══════════════════════════════════════════════
  // TAB 2: TAGS & THEMES
  // Tag model: id, name, description (no slug)
  // ═══════════════════════════════════════════════

  async getTags() {
    const tags = await this.tagModel.findAll({
      order: [['createdAt', 'ASC']],
    });

    const result = await Promise.all(
      tags.map(async (tag: any) => {
        const usageCount = await this.contributionTagModel.count({
          where: { tag_id: tag.id },
        });
        return {
          id: tag.id,
          name: tag.name,
          usage_count: usageCount,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        };
      }),
    );

    return { tags: result, total: result.length };
  }

  async createTag(dto: { name: string }) {
    const existing = await this.tagModel.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Tag "${dto.name}" already exists`);
    }

    const tag = await this.tagModel.create({
      name: dto.name,
    } as any);

    return { message: 'Tag created successfully', tag };
  }

  async updateTag(id: string, dto: { name: string }) {
    const tag = await this.tagModel.findByPk(id);
    if (!tag) throw new NotFoundException('Tag not found');

    const existing = await this.tagModel.findOne({
      where: { name: dto.name },
    });
    if (existing && (existing as any).id !== id) {
      throw new ConflictException(`Tag "${dto.name}" already exists`);
    }

    await tag.update({ name: dto.name });
    return { message: 'Tag updated successfully', tag };
  }

  async deleteTag(id: string) {
    const tag = await this.tagModel.findByPk(id);
    if (!tag) throw new NotFoundException('Tag not found');

    await this.contributionTagModel.destroy({
      where: { tag_id: id },
    });

    await tag.destroy();
    return { message: 'Tag deleted successfully' };
  }

  // ═══════════════════════════════════════════════
  // TAB 3: BADGES
  // ═══════════════════════════════════════════════

  async getBadges() {
    const badges = await this.badgeModel.findAll({
      order: [['createdAt', 'ASC']],
    });

    return {
      badges: badges.map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        criteria_type: b.criteria_type,
        criteria_value: b.criteria_value,
        is_active: b.is_active,
        awarded_count: b.awarded_count,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      total: badges.length,
    };
  }

  async createBadge(dto: {
    name: string;
    description?: string;
    icon?: string;
    criteria_type?: string;
    criteria_value?: number;
  }) {
    const existing = await this.badgeModel.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Badge "${dto.name}" already exists`);
    }

    const badge = await this.badgeModel.create({
      name: dto.name,
      description: dto.description || '',
      icon: dto.icon || 'trophy',
      criteria_type: dto.criteria_type || 'custom',
      criteria_value: dto.criteria_value || 0,
    } as any);

    return { message: 'Badge created successfully', badge };
  }

  async updateBadge(
    id: string,
    dto: {
      name?: string;
      description?: string;
      icon?: string;
      criteria_type?: string;
      criteria_value?: number;
      is_active?: boolean;
    },
  ) {
    const badge = await this.badgeModel.findByPk(id);
    if (!badge) throw new NotFoundException('Badge not found');

    if (dto.name) {
      const existing = await this.badgeModel.findOne({
        where: { name: dto.name },
      });
      if (existing && (existing as any).id !== id) {
        throw new ConflictException(`Badge "${dto.name}" already exists`);
      }
    }

    await badge.update(dto);
    return { message: 'Badge updated successfully', badge };
  }

  async deleteBadge(id: string) {
    const badge = await this.badgeModel.findByPk(id);
    if (!badge) throw new NotFoundException('Badge not found');

    await badge.destroy();
    return { message: 'Badge deleted successfully' };
  }

  // ═══════════════════════════════════════════════
  // TAB 4: EMAIL TEMPLATES
  // ═══════════════════════════════════════════════

  async getEmailTemplates() {
    const templates = await this.emailTemplateModel.findAll({
      order: [['updatedAt', 'DESC']],
    });

    return {
      templates: templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        subject: t.subject,
        body: t.body,
        is_active: t.is_active,
        updatedAt: t.updatedAt,
        createdAt: t.createdAt,
      })),
      total: templates.length,
      available_variables: ['{{name}}', '{{email}}', '{{role}}', '{{date}}'],
    };
  }

  async getEmailTemplate(id: string) {
    const template = await this.emailTemplateModel.findByPk(id);
    if (!template) throw new NotFoundException('Email template not found');

    return {
      template,
      available_variables: ['{{name}}', '{{email}}', '{{role}}', '{{date}}'],
    };
  }

  async updateEmailTemplate(
    id: string,
    dto: {
      name?: string;
      category?: string;
      subject?: string;
      body?: string;
      is_active?: boolean;
    },
  ) {
    const template = await this.emailTemplateModel.findByPk(id);
    if (!template) throw new NotFoundException('Email template not found');

    await template.update(dto);
    return { message: 'Email template updated successfully', template };
  }

  async createEmailTemplate(dto: {
    name: string;
    category?: string;
    subject: string;
    body: string;
  }) {
    const existing = await this.emailTemplateModel.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Template "${dto.name}" already exists`);
    }

    const template = await this.emailTemplateModel.create({
      name: dto.name,
      category: dto.category || 'general',
      subject: dto.subject,
      body: dto.body,
    } as any);

    return { message: 'Email template created successfully', template };
  }

  async deleteEmailTemplate(id: string) {
    const template = await this.emailTemplateModel.findByPk(id);
    if (!template) throw new NotFoundException('Email template not found');

    await template.destroy();
    return { message: 'Email template deleted successfully' };
  }

  // ═══════════════════════════════════════════════
  // TAB 5: LOCALISATION
  // FIX: SiteSettings has NO `group` column — only key + value
  // ═══════════════════════════════════════════════

  async getLocalisationSettings() {
    const keys = [
      'default_language',
      'timezone',
      'date_format',
      'enable_multi_language',
    ];

    const settings: Record<string, any> = {};

    for (const key of keys) {
      const [record] = await this.siteSettingsModel.findOrCreate({
        where: { key },
        // FIX: Removed `group` — SiteSettings only has key + value
        defaults: {
          key,
          value: this.getLocalisationDefault(key),
        } as any,
      });
      settings[key] = (record as any).value;
    }

    settings.enable_multi_language = settings.enable_multi_language === 'true';

    return settings;
  }

  async updateLocalisationSettings(dto: {
    default_language?: string;
    timezone?: string;
    date_format?: string;
    enable_multi_language?: boolean;
  }) {
    const updates: { key: string; value: string }[] = [];

    if (dto.default_language !== undefined) {
      updates.push({ key: 'default_language', value: dto.default_language });
    }
    if (dto.timezone !== undefined) {
      updates.push({ key: 'timezone', value: dto.timezone });
    }
    if (dto.date_format !== undefined) {
      updates.push({ key: 'date_format', value: dto.date_format });
    }
    if (dto.enable_multi_language !== undefined) {
      updates.push({
        key: 'enable_multi_language',
        value: String(dto.enable_multi_language),
      });
    }

    for (const { key, value } of updates) {
      // FIX: Removed `group` from upsert — SiteSettings only has key + value
      const [record] = await this.siteSettingsModel.findOrCreate({
        where: { key },
        defaults: { key, value } as any,
      });
      await record.update({ value });
    }

    return {
      message: 'Localisation settings updated successfully',
      settings: await this.getLocalisationSettings(),
    };
  }

  // ═══════════════════════════════════════════════
  // TAB 6: GUIDELINES
  // FIX: Same — no `group` column
  // ═══════════════════════════════════════════════

  async getGuidelines() {
    const keys = ['community_guidelines', 'content_policy', 'enable_multi_language_guidelines'];

    const settings: Record<string, any> = {};

    for (const key of keys) {
      const [record] = await this.siteSettingsModel.findOrCreate({
        where: { key },
        // FIX: Removed `group`
        defaults: {
          key,
          value: this.getGuidelinesDefault(key),
        } as any,
      });
      settings[key] = (record as any).value;
    }

    settings.enable_multi_language_guidelines =
      settings.enable_multi_language_guidelines === 'true';

    return settings;
  }

  async updateGuidelines(dto: {
    community_guidelines?: string;
    content_policy?: string;
    enable_multi_language_guidelines?: boolean;
  }) {
    const updates: { key: string; value: string }[] = [];

    if (dto.community_guidelines !== undefined) {
      updates.push({ key: 'community_guidelines', value: dto.community_guidelines });
    }
    if (dto.content_policy !== undefined) {
      updates.push({ key: 'content_policy', value: dto.content_policy });
    }
    if (dto.enable_multi_language_guidelines !== undefined) {
      updates.push({
        key: 'enable_multi_language_guidelines',
        value: String(dto.enable_multi_language_guidelines),
      });
    }

    for (const { key, value } of updates) {
      // FIX: Removed `group`
      const [record] = await this.siteSettingsModel.findOrCreate({
        where: { key },
        defaults: { key, value } as any,
      });
      await record.update({ value });
    }

    return {
      message: 'Guidelines updated successfully',
      settings: await this.getGuidelines(),
    };
  }

  // ═══════════════════════════════════════════════
  // SYSTEM HEALTH
  // ═══════════════════════════════════════════════

  async getSystemHealth() {
    try {
      await this.siteSettingsModel.findOne();

      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'degraded',
        database: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getLocalisationDefault(key: string): string {
    const defaults: Record<string, string> = {
      default_language: 'English',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      enable_multi_language: 'true',
    };
    return defaults[key] || '';
  }

  private getGuidelinesDefault(key: string): string {
    const defaults: Record<string, string> = {
      community_guidelines:
        '1. Be respectful to all community members\n2. No hate speech or discrimination\n3. Original content only - no plagiarism\n4. Credit sources when applicable\n5. No spam or self-promotion',
      content_policy:
        'All content must be original or properly licensed. Copyrighted material without permission will be removed. Adult content must be properly tagged.',
      enable_multi_language_guidelines: 'false',
    };
    return defaults[key] || '';
  }
}