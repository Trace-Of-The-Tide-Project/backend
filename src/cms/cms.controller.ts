import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import {
  CreatePageDto,
  UpdatePageDto,
  CreatePageSectionDto,
  UpdatePageSectionDto,
  UpdateSiteSettingsDto,
} from './dto/cms.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ═══════════════════════════════════════════════════════════
  // PAGES (Static Pages tab)
  // ═══════════════════════════════════════════════════════════

  @Get('pages')
  @ApiOperation({ summary: 'List all pages (public)' })
  findAllPages() {
    return this.cmsService.findAllPages();
  }

  @Get('pages/slug/:slug')
  @ApiOperation({ summary: 'Get page by slug (public — for frontend rendering)' })
  findBySlug(@Param('slug') slug: string) {
    return this.cmsService.findPageBySlug(slug);
  }

  @Get('pages/:id')
  @ApiOperation({ summary: 'Get page by ID' })
  findPage(@Param('id') id: string) {
    return this.cmsService.findPageById(id);
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new page (admin)' })
  createPage(@Body() dto: CreatePageDto, @Req() req: any) {
    return this.cmsService.createPage(dto, req.user.sub);
  }

  @Patch('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update page content (admin)' })
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto, @Req() req: any) {
    return this.cmsService.updatePage(id, dto, req.user.sub);
  }

  @Patch('pages/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a page' })
  publishPage(@Param('id') id: string) {
    return this.cmsService.publishPage(id);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a page (cannot delete homepage)' })
  deletePage(@Param('id') id: string) {
    return this.cmsService.deletePage(id);
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE SECTIONS (Homepage visual editor)
  // ═══════════════════════════════════════════════════════════

  @Get('pages/:id/sections')
  @ApiOperation({ summary: 'Get all sections of a page (ordered)' })
  getSections(@Param('id') id: string) {
    return this.cmsService.getSections(id);
  }

  @Post('pages/:id/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a section to a page' })
  addSection(@Param('id') id: string, @Body() dto: CreatePageSectionDto) {
    return this.cmsService.addSection(id, dto);
  }

  @Patch('pages/:id/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder sections (drag-and-drop)' })
  reorderSections(@Param('id') id: string, @Body('sectionIds') sectionIds: string[]) {
    return this.cmsService.reorderSections(id, sectionIds);
  }

  @Patch('pages/:id/sections/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a section (config, title, etc)' })
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdatePageSectionDto,
  ) {
    return this.cmsService.updateSection(id, sectionId, dto);
  }

  @Patch('pages/:id/sections/:sectionId/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle section visibility (eye icon in Figma)' })
  toggleVisibility(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return this.cmsService.toggleSectionVisibility(id, sectionId);
  }

  @Delete('pages/:id/sections/:sectionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a section' })
  removeSection(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return this.cmsService.removeSection(id, sectionId);
  }

  // ═══════════════════════════════════════════════════════════
  // SITE SETTINGS (Navigation, Footer, Branding tabs)
  // ═══════════════════════════════════════════════════════════

  @Get('settings')
  @ApiOperation({ summary: 'Get all site settings (navigation, footer, branding)' })
  getAllSettings() {
    return this.cmsService.getAllSettings();
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get a specific setting by key' })
  getSetting(@Param('key') key: string) {
    return this.cmsService.getSetting(key);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a site setting (upsert)' })
  upsertSetting(@Body() dto: UpdateSiteSettingsDto) {
    return this.cmsService.upsertSetting(dto.key, dto.value);
  }

  @Delete('settings/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a site setting' })
  deleteSetting(@Param('key') key: string) {
    return this.cmsService.deleteSetting(key);
  }
}