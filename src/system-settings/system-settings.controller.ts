import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('System Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/system-settings')
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  // ═══════════════════════════════════════════════
  // SYSTEM HEALTH
  // ═══════════════════════════════════════════════

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  getSystemHealth() {
    return this.service.getSystemHealth();
  }

  // ═══════════════════════════════════════════════
  // TAB 1: CATEGORIES
  // ═══════════════════════════════════════════════

  @Get('categories')
  @ApiOperation({ summary: 'List all content categories with item counts' })
  getCategories() {
    return this.service.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new content category' })
  createCategory(
    @Body() dto: { name: string; slug?: string; description?: string },
  ) {
    return this.service.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a content category' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: { name?: string; slug?: string; description?: string },
  ) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a content category (must have 0 items)' })
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  // ═══════════════════════════════════════════════
  // TAB 2: TAGS & THEMES
  // ═══════════════════════════════════════════════

  @Get('tags')
  @ApiOperation({ summary: 'List all content tags with usage counts' })
  getTags() {
    return this.service.getTags();
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create a new content tag' })
  createTag(@Body() dto: { name: string }) {
    return this.service.createTag(dto);
  }

  @Patch('tags/:id')
  @ApiOperation({ summary: 'Update a content tag' })
  updateTag(@Param('id') id: string, @Body() dto: { name: string }) {
    return this.service.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Delete a content tag (removes associations)' })
  deleteTag(@Param('id') id: string) {
    return this.service.deleteTag(id);
  }

  // ═══════════════════════════════════════════════
  // TAB 3: BADGES
  // ═══════════════════════════════════════════════

  @Get('badges')
  @ApiOperation({ summary: 'List all achievement badges' })
  getBadges() {
    return this.service.getBadges();
  }

  @Post('badges')
  @ApiOperation({ summary: 'Create a new achievement badge' })
  createBadge(
    @Body()
    dto: {
      name: string;
      description?: string;
      icon?: string;
      criteria_type?: string;
      criteria_value?: number;
    },
  ) {
    return this.service.createBadge(dto);
  }

  @Patch('badges/:id')
  @ApiOperation({ summary: 'Update an achievement badge' })
  updateBadge(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      icon?: string;
      criteria_type?: string;
      criteria_value?: number;
      is_active?: boolean;
    },
  ) {
    return this.service.updateBadge(id, dto);
  }

  @Delete('badges/:id')
  @ApiOperation({ summary: 'Delete an achievement badge' })
  deleteBadge(@Param('id') id: string) {
    return this.service.deleteBadge(id);
  }

  // ═══════════════════════════════════════════════
  // TAB 4: EMAIL TEMPLATES
  // ═══════════════════════════════════════════════

  @Get('email-templates')
  @ApiOperation({ summary: 'List all email templates' })
  getEmailTemplates() {
    return this.service.getEmailTemplates();
  }

  @Get('email-templates/:id')
  @ApiOperation({
    summary: 'Get a single email template with available variables',
  })
  getEmailTemplate(@Param('id') id: string) {
    return this.service.getEmailTemplate(id);
  }

  @Post('email-templates')
  @ApiOperation({ summary: 'Create a new email template' })
  createEmailTemplate(
    @Body()
    dto: {
      name: string;
      category?: string;
      subject: string;
      body: string;
    },
  ) {
    return this.service.createEmailTemplate(dto);
  }

  @Patch('email-templates/:id')
  @ApiOperation({ summary: 'Update an email template' })
  updateEmailTemplate(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      category?: string;
      subject?: string;
      body?: string;
      is_active?: boolean;
    },
  ) {
    return this.service.updateEmailTemplate(id, dto);
  }

  @Delete('email-templates/:id')
  @ApiOperation({ summary: 'Delete an email template' })
  deleteEmailTemplate(@Param('id') id: string) {
    return this.service.deleteEmailTemplate(id);
  }

  // ═══════════════════════════════════════════════
  // TAB 5: LOCALISATION
  // ═══════════════════════════════════════════════

  @Get('localisation')
  @ApiOperation({ summary: 'Get language/timezone/date format settings' })
  getLocalisationSettings() {
    return this.service.getLocalisationSettings();
  }

  @Patch('localisation')
  @ApiOperation({ summary: 'Update localisation settings' })
  updateLocalisationSettings(
    @Body()
    dto: {
      default_language?: string;
      timezone?: string;
      date_format?: string;
      enable_multi_language?: boolean;
    },
  ) {
    return this.service.updateLocalisationSettings(dto);
  }

  // ═══════════════════════════════════════════════
  // TAB 6: GUIDELINES
  // ═══════════════════════════════════════════════

  @Get('guidelines')
  @ApiOperation({
    summary: 'Get platform community guidelines and content policy',
  })
  getGuidelines() {
    return this.service.getGuidelines();
  }

  @Patch('guidelines')
  @ApiOperation({ summary: 'Update platform guidelines' })
  updateGuidelines(
    @Body()
    dto: {
      community_guidelines?: string;
      content_policy?: string;
      enable_multi_language_guidelines?: boolean;
    },
  ) {
    return this.service.updateGuidelines(dto);
  }
}
