import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ============================================================
  // COMMAND CENTER — Full dashboard in one call
  // ============================================================

  @Get()
  @ApiOperation({ summary: 'Get full dashboard summary (Command Center)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', '1y'],
  })
  async getFullDashboard() {
    return this.dashboardService.getFullDashboard();
  }

  // ============================================================
  // TOP STATS CARDS
  // ============================================================

  @Get('stats')
  @ApiOperation({ summary: 'Get top-level stat cards with percentage changes' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', '1y'],
  })
  async getStats(@Query('period') period?: string) {
    return this.dashboardService.getStats(period);
  }

  // ============================================================
  // ALERTS & NOTIFICATIONS
  // ============================================================

  @Get('alerts')
  @ApiOperation({
    summary: 'Get alerts: flagged content, pending reviews, editor apps',
  })
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }

  // ============================================================
  // EDITOR APPLICATIONS
  // ============================================================

  @Get('editor-applications')
  @ApiOperation({ summary: 'Get pending editor role applications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getEditorApplications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getEditorApplications(page, limit);
  }

  // ============================================================
  // CONTENT OVERVIEW
  // ============================================================

  @Get('content-overview')
  @ApiOperation({
    summary: 'Content breakdown by category (published, drafts, flagged)',
  })
  async getContentOverview() {
    return this.dashboardService.getContentOverview();
  }

  // ============================================================
  // USERS BY ROLE
  // ============================================================

  @Get('users-by-role')
  @ApiOperation({ summary: 'User counts per role with growth percentages' })
  async getUsersByRole() {
    return this.dashboardService.getUsersByRole();
  }

  // ============================================================
  // USERS MANAGEMENT
  // ============================================================

  @Get('users')
  @ApiOperation({ summary: 'List users with search, role/status filters' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const offset = (page - 1) * limit;
    return this.dashboardService.getUsers({
      role,
      status,
      search,
      limit,
      offset,
    });
  }

  // ============================================================
  // CONTENT LIBRARY
  // ============================================================

  @Get('content-library')
  @ApiOperation({ summary: 'Browse all contributions with filters' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Contribution type name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['published', 'draft', 'pending', 'flagged'],
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getContentLibrary(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const offset = (page - 1) * limit;
    return this.dashboardService.getContentLibrary({
      type,
      status,
      search,
      limit,
      offset,
    });
  }

  // ============================================================
  // FINANCE
  // ============================================================

  @Get('finance/snapshot')
  @ApiOperation({
    summary: 'Finance overview: donations, revenue, payouts, fees',
  })
  async getFinanceSnapshot() {
    return this.dashboardService.getFinanceSnapshot();
  }

  @Get('finance/donations')
  @ApiOperation({ summary: 'List all donations with filters' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['completed', 'pending', 'failed'],
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFinanceDonations(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const offset = (page - 1) * limit;
    return this.dashboardService.getFinanceDonations({
      status,
      limit,
      offset,
    });
  }

  // ============================================================
  // RECENT ACTIVITY
  // ============================================================

  @Get('recent-activity')
  @ApiOperation({ summary: 'Recent platform activity feed' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentActivity(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentActivity(limit);
  }

  // ============================================================
  // REPORTS & MODERATION
  // ============================================================

  @Get('moderation/stats')
  @ApiOperation({ summary: 'Moderation stats: pending, flagged, resolved' })
  async getModerationStats() {
    return this.dashboardService.getModerationStats();
  }

  @Get('moderation/reports')
  @ApiOperation({ summary: 'List moderation reports' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['flagged', 'approved', 'rejected'],
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getModerationReports(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const offset = (page - 1) * limit;
    return this.dashboardService.getModerationReports({
      status,
      search,
      limit,
      offset,
    });
  }

  @Get('moderation/audit-log')
  @ApiOperation({ summary: 'Audit trail log' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLog(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const offset = (page - 1) * limit;
    return this.dashboardService.getAuditLog({ limit, offset });
  }

  // ============================================================
  // OPEN CALLS
  // ============================================================

  @Get('open-calls')
  @ApiOperation({ summary: 'Open calls overview with recent calls' })
  async getOpenCallsOverview() {
    return this.dashboardService.getOpenCallsOverview();
  }

  // ============================================================
  // COLLECTIONS
  // ============================================================

  @Get('collections')
  @ApiOperation({ summary: 'Collections overview' })
  async getCollectionsOverview() {
    return this.dashboardService.getCollectionsOverview();
  }

  // ============================================================
  // ANALYTICS
  // ============================================================

  @Get('analytics/platform-growth')
  @ApiOperation({ summary: 'User registration trends over time' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', '1y'],
  })
  async getAnalyticsPlatformGrowth(@Query('period') period?: string) {
    return this.dashboardService.getAnalyticsPlatformGrowth(period);
  }

  @Get('analytics/content-performance')
  @ApiOperation({ summary: 'Content publishing trends and top contributors' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', '1y'],
  })
  async getAnalyticsContentPerformance(@Query('period') period?: string) {
    return this.dashboardService.getAnalyticsContentPerformance(period);
  }
}
