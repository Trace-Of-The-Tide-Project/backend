import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Page } from './models/page.model';
import { PageSection } from './models/page-section.model';
import { SiteSettings } from './models/site-settings.model';
import { User } from '../users/models/user.model';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(Page) private readonly pageModel: typeof Page,
    @InjectModel(PageSection) private readonly sectionModel: typeof PageSection,
    @InjectModel(SiteSettings)
    private readonly settingsModel: typeof SiteSettings,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // PAGES
  // ═══════════════════════════════════════════════════════════

  async findAllPages() {
    return this.pageModel.findAll({
      include: [
        {
          model: PageSection,
          separate: true,
          order: [['section_order', 'ASC']] as any,
        },
        {
          model: User,
          as: 'editor',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async findPageBySlug(slug: string) {
    const page = await this.pageModel.findOne({
      where: { slug },
      include: [
        {
          model: PageSection,
          separate: true,
          order: [['section_order', 'ASC']] as any,
        },
      ],
    });
    if (!page) throw new NotFoundException(`Page "${slug}" not found`);
    return page;
  }

  async findPageById(id: string) {
    const page = await this.pageModel.findByPk(id, {
      include: [
        {
          model: PageSection,
          separate: true,
          order: [['section_order', 'ASC']] as any,
        },
      ],
    });
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    return page;
  }

  async createPage(data: any, userId: string) {
    // Check slug uniqueness
    const existing = await this.pageModel.findOne({
      where: { slug: data.slug },
    });
    if (existing)
      throw new BadRequestException(`Slug "${data.slug}" already exists`);
    return this.pageModel.create({ ...data, updated_by: userId });
  }

  async updatePage(id: string, data: any, userId: string) {
    const page = await this.pageModel.findByPk(id);
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    await page.update({ ...data, updated_by: userId });
    return page;
  }

  async publishPage(id: string) {
    const page = await this.pageModel.findByPk(id);
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    await page.update({ status: 'published' });
    return page;
  }

  async deletePage(id: string) {
    const page = await this.pageModel.findByPk(id);
    if (!page) throw new NotFoundException(`Page ${id} not found`);
    if (page.page_type === 'homepage') {
      throw new BadRequestException('Cannot delete the homepage');
    }
    await this.sectionModel.destroy({ where: { page_id: id } });
    await page.destroy();
    return { message: 'Page deleted' };
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE SECTIONS (Homepage visual editor)
  // ═══════════════════════════════════════════════════════════

  async getSections(pageId: string) {
    await this.findPageById(pageId);
    return this.sectionModel.findAll({
      where: { page_id: pageId },
      order: [['section_order', 'ASC']],
    });
  }

  async addSection(pageId: string, data: any) {
    const page = await this.pageModel.findByPk(pageId);
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);
    return this.sectionModel.create({ ...data, page_id: pageId });
  }

  async updateSection(pageId: string, sectionId: string, data: any) {
    const section = await this.sectionModel.findOne({
      where: { id: sectionId, page_id: pageId },
    });
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    await section.update(data);
    return section;
  }

  async toggleSectionVisibility(pageId: string, sectionId: string) {
    const section = await this.sectionModel.findOne({
      where: { id: sectionId, page_id: pageId },
    });
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    await section.update({ is_visible: !section.is_visible });
    return section;
  }

  async reorderSections(pageId: string, sectionIds: string[]) {
    await this.findPageById(pageId);
    for (let i = 0; i < sectionIds.length; i++) {
      await this.sectionModel.update(
        { section_order: i + 1 },
        { where: { id: sectionIds[i], page_id: pageId } },
      );
    }
    return this.getSections(pageId);
  }

  async removeSection(pageId: string, sectionId: string) {
    const section = await this.sectionModel.findOne({
      where: { id: sectionId, page_id: pageId },
    });
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    await section.destroy();
    return { message: 'Section removed' };
  }

  // ═══════════════════════════════════════════════════════════
  // SITE SETTINGS (Navigation, Footer, Branding)
  // ═══════════════════════════════════════════════════════════

  async getAllSettings() {
    const settings = await this.settingsModel.findAll();
    const result: Record<string, any> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async getSetting(key: string) {
    const setting = await this.settingsModel.findOne({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    try {
      return { key: setting.key, value: JSON.parse(setting.value) };
    } catch {
      return { key: setting.key, value: setting.value };
    }
  }

  async upsertSetting(key: string, value: string) {
    const [setting, created] = await this.settingsModel.findOrCreate({
      where: { key },
      defaults: { key, value } as any,
    });
    if (!created) {
      await setting.update({ value });
    }
    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    return { key, value: parsedValue, created };
  }

  async deleteSetting(key: string) {
    const deleted = await this.settingsModel.destroy({ where: { key } });
    if (!deleted) throw new NotFoundException(`Setting "${key}" not found`);
    return { message: `Setting "${key}" deleted` };
  }
}
