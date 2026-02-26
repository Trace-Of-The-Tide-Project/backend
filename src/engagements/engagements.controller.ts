import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import { EngagementsService } from './engagements.service';

@ApiTags('Admin Engagements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/engagements')
export class EngagementsController {
  constructor(private readonly service: EngagementsService) {}

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════

  @Get('stats')
  @ApiOperation({ summary: 'Get engagement stats (comments, likes, discussions, badges)' })
  getStats() {
    return this.service.getStats();
  }

  // ═══════════════════════════════════════════════
  // TAB 1: COMMENTS
  // ═══════════════════════════════════════════════

  @Get('comments')
  @ApiOperation({ summary: 'List comments with search and flagged filter' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'filter', required: false, enum: ['all', 'flagged'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getComments(
    @Query('search') search?: string,
    @Query('filter') filter?: 'all' | 'flagged',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getComments({
      search,
      filter,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('comments/:id/flag')
  @ApiOperation({ summary: 'Flag a comment' })
  flagComment(@Req() req: any, @Param('id') id: string) {
    const adminId = req.user.sub || req.user.id || req.user.userId;
    return this.service.flagComment(id, adminId);
  }

  @Patch('comments/:id/unflag')
  @ApiOperation({ summary: 'Unflag a comment' })
  unflagComment(@Param('id') id: string) {
    return this.service.unflagComment(id);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a comment and its replies' })
  deleteComment(@Param('id') id: string) {
    return this.service.deleteComment(id);
  }

  // ═══════════════════════════════════════════════
  // TAB 2: TRENDING DISCUSSIONS
  // ═══════════════════════════════════════════════

  @Get('discussions')
  @ApiOperation({ summary: 'List trending discussions with comment/participant counts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTrendingDiscussions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTrendingDiscussions({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('discussions/:id')
  @ApiOperation({ summary: 'View a discussion with its comments' })
  getDiscussion(@Param('id') id: string) {
    return this.service.getDiscussion(id);
  }

  @Patch('discussions/:id/lock')
  @ApiOperation({ summary: 'Lock a discussion (prevent new comments)' })
  lockDiscussion(@Param('id') id: string) {
    return this.service.lockDiscussion(id);
  }

  @Patch('discussions/:id/unlock')
  @ApiOperation({ summary: 'Unlock a discussion' })
  unlockDiscussion(@Param('id') id: string) {
    return this.service.unlockDiscussion(id);
  }

  // ═══════════════════════════════════════════════
  // TAB 3: BADGES & RECOGNITION
  // ═══════════════════════════════════════════════

  @Get('badges')
  @ApiOperation({ summary: 'List all badges with recipient counts' })
  @ApiQuery({ name: 'search', required: false })
  getBadgesWithRecipients(@Query('search') search?: string) {
    return this.service.getBadgesWithRecipients(search);
  }

  @Post('badges/create-and-award')
  @ApiOperation({ summary: 'Create a new badge and optionally award to a role' })
  createAndAwardBadge(
    @Req() req: any,
    @Body() dto: { name: string; icon?: string; role?: string; reason?: string },
  ) {
    const adminId = req.user.sub || req.user.id || req.user.userId;
    return this.service.createAndAwardBadge(adminId, dto);
  }

  @Post('badges/:badgeId/award')
  @ApiOperation({ summary: 'Award an existing badge to a specific user' })
  awardBadgeToUser(
    @Req() req: any,
    @Param('badgeId') badgeId: string,
    @Body()
    dto: {
      user_id?: string;
      username?: string;
      description?: string;
      criteria?: string;
    },
  ) {
    const adminId = req.user.sub || req.user.id || req.user.userId;
    return this.service.awardBadgeToUser(adminId, badgeId, dto);
  }

  @Delete('badges/:badgeId/users/:userId')
  @ApiOperation({ summary: 'Revoke a badge from a user' })
  revokeBadge(
    @Param('badgeId') badgeId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.revokeBadge(badgeId, userId);
  }

  @Get('badges/:badgeId/recipients')
  @ApiOperation({ summary: 'List all recipients of a specific badge' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getBadgeRecipients(
    @Param('badgeId') badgeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getBadgeRecipients(
      badgeId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}