import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { AuthorDashboardService } from './author-dashboard.service';

@ApiTags('Author Dashboard')
@ApiBearerAuth()
@Controller('author')
@UseGuards(JwtAuthGuard)
export class AuthorDashboardController {
  constructor(private readonly service: AuthorDashboardService) {}

  private getUserId(req: any): string {
    return req.user.sub || req.user.id || req.user.userId;
  }

  // ─── MAIN DASHBOARD ──────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Author main dashboard (profile + stats + recent items)' })
  async getDashboard(@Req() req: any) {
    return this.service.getDashboard(this.getUserId(req));
  }

  // ─── ANALYTICS ────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Author analytics — top performing articles' })
  async getAnalytics(@Req() req: any) {
    return this.service.getAuthorAnalytics(this.getUserId(req));
  }

  // ─── SUPPORTERS ───────────────────────────────────

  @Get('supporters')
  @ApiOperation({ summary: 'List supporters/donors' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'one-time', 'recurring'] })
  async getSupporters(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.service.getSupporters(this.getUserId(req), { page, limit, type });
  }

  @Post('supporters/:donationId/thank')
  @ApiOperation({ summary: 'Thank a contributor' })
  async thankContributor(
    @Req() req: any,
    @Param('donationId') donationId: string,
  ) {
    return this.service.thankContributor(this.getUserId(req), donationId);
  }

  // ─── SETTINGS: PROFILE ───────────────────────────

  @Get('settings/profile')
  @ApiOperation({ summary: 'Get profile information' })
  async getProfile(@Req() req: any) {
    return this.service.getProfile(this.getUserId(req));
  }

  @Patch('settings/profile')
  @ApiOperation({ summary: 'Update profile information' })
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      full_name?: string;
      email?: string;
      avatar?: string;
      display_name?: string;
      location?: string;
      about?: string;
      social_links?: any;
      birth_date?: string;
      gender?: string;
      role_title?: string;
      company?: string;
      external_link?: string;
    },
  ) {
    return this.service.updateProfile(this.getUserId(req), body);
  }

  // ─── SETTINGS: NOTIFICATIONS ─────────────────────

  @Get('settings/notifications')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getNotifications(@Req() req: any) {
    return this.service.getNotificationSettings(this.getUserId(req));
  }

  @Patch('settings/notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotifications(
    @Req() req: any,
    @Body()
    body: {
      article_updates?: boolean;
      new_followers?: boolean;
      new_contributors?: boolean;
      comments?: boolean;
      weekly_digest?: boolean;
      push_browser?: boolean;
    },
  ) {
    return this.service.updateNotificationSettings(this.getUserId(req), body);
  }

  // ─── SETTINGS: PRIVACY ───────────────────────────

  @Get('settings/privacy')
  @ApiOperation({ summary: 'Get privacy settings' })
  async getPrivacy(@Req() req: any) {
    return this.service.getPrivacySettings(this.getUserId(req));
  }

  @Patch('settings/privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  async updatePrivacy(
    @Req() req: any,
    @Body()
    body: {
      profile_visibility?: string;
      show_email?: boolean;
      show_activity?: boolean;
      allow_follows?: boolean;
    },
  ) {
    return this.service.updatePrivacySettings(this.getUserId(req), body);
  }

  // ─── SETTINGS: PASSWORD ──────────────────────────

  @Patch('settings/password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @Req() req: any,
    @Body()
    body: {
      current_password: string;
      new_password: string;
      confirm_password: string;
    },
  ) {
    return this.service.changePassword(this.getUserId(req), body);
  }

  // ─── SETTINGS: AVAILABILITY ──────────────────────

  @Get('settings/availability')
  @ApiOperation({ summary: 'Get availability status' })
  async getAvailability(@Req() req: any) {
    return this.service.getAvailability(this.getUserId(req));
  }

  @Patch('settings/availability')
  @ApiOperation({ summary: 'Update availability status' })
  async updateAvailability(
    @Req() req: any,
    @Body() body: { status?: string; message?: string },
  ) {
    return this.service.updateAvailability(this.getUserId(req), body);
  }

  // ─── SETTINGS: ACCOUNT ───────────────────────────

  @Post('settings/account/deactivate')
  @ApiOperation({ summary: 'Deactivate account (requires password confirmation)' })
  async deactivateAccount(
    @Req() req: any,
    @Body() body: { password: string },
  ) {
    return this.service.deactivateAccount(this.getUserId(req), body.password);
  }

  @Post('settings/account/reactivate')
  @ApiOperation({ summary: 'Reactivate deactivated account' })
  async reactivateAccount(@Req() req: any) {
    return this.service.reactivateAccount(this.getUserId(req));
  }
}