import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform overview — user growth, content stats, trend charts' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'], description: 'Time period filter' })
  getOverview(@Query('period') period: string) {
    return this.analyticsService.getOverview(period);
  }

  @Get('content-performance')
  @ApiOperation({ summary: 'Content performance — top categories, top articles, type distribution' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  getContentPerformance(@Query('period') period: string) {
    return this.analyticsService.getContentPerformance(period);
  }

  @Get('top-creators')
  @ApiOperation({ summary: 'Top creators — authors by views, contributors, top earners' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  getTopCreators(@Query('period') period: string, @Query('limit') limit: string) {
    return this.analyticsService.getTopCreators(period, limit ? parseInt(limit) : 10);
  }

  @Get('conversion-funnel')
  @ApiOperation({ summary: 'Conversion funnel — visitor to editor journey with conversion rates' })
  getConversionFunnel() {
    return this.analyticsService.getConversionFunnel();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Platform summary — all entity counts in one call (for dashboard cards)' })
  getPlatformSummary() {
    return this.analyticsService.getPlatformSummary();
  }
}