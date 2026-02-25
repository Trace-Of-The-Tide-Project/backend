import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // ─── SUMMARY ─────────────────────────────────────

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Messaging dashboard summary cards' })
  async getSummary() {
    return this.messagingService.getMessagingSummary();
  }

  // ─── TAB 1: INBOX (Admin) ────────────────────────

  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all conversations (admin inbox)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'pending', 'resolved', 'archived'] })
  @ApiQuery({ name: 'category', required: false, enum: ['payment', 'content', 'account', 'technical', 'general'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'normal', 'high', 'urgent'] })
  @ApiQuery({ name: 'search', required: false })
  async listConversations(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.messagingService.listConversations({ page, limit, status, category, priority, search });
  }

  @Get('conversations/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my conversations (user)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyConversations(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.sub || req.user.id || req.user.userId;
    return this.messagingService.getMyConversations(userId, { page, limit });
  }

  @Get('conversations/archived')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List archived conversations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listArchived(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.listArchived({ page, limit });
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get conversation with messages' })
  async getConversation(@Param('id') id: string) {
    return this.messagingService.getConversation(id);
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start a new conversation (user)' })
  async createConversation(
    @Req() req: any,
    @Body() body: { subject: string; message: string; category?: string; priority?: string },
  ) {
    return this.messagingService.createConversation(req.user.sub || req.user.id || req.user.userId, body);
  }

  @Post('conversations/:id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reply to a conversation' })
  async replyToConversation(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { content: string; template_id?: string },
  ) {
    return this.messagingService.replyToConversation(id, req.user.sub || req.user.id || req.user.userId, body);
  }

  @Patch('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark conversation messages as read' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.messagingService.markAsRead(id, req.user.sub || req.user.id || req.user.userId);
  }

  @Patch('conversations/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Resolve a conversation' })
  async resolveConversation(@Param('id') id: string) {
    return this.messagingService.resolveConversation(id);
  }

  @Patch('conversations/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Archive a conversation' })
  async archiveConversation(@Param('id') id: string) {
    return this.messagingService.archiveConversation(id);
  }

  @Patch('conversations/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Assign conversation to an admin' })
  async assignConversation(
    @Param('id') id: string,
    @Body() body: { admin_id: string },
  ) {
    return this.messagingService.assignConversation(id, body.admin_id);
  }

  // ─── TAB 2: BROADCAST ────────────────────────────

  @Get('broadcasts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all broadcasts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'sent', 'scheduled'] })
  async listBroadcasts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.messagingService.listBroadcasts({ page, limit, status });
  }

  @Post('broadcasts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create broadcast (draft or send immediately)' })
  async createBroadcast(
    @Req() req: any,
    @Body() body: {
      subject: string;
      message: string;
      target_audience?: string;
      priority?: string;
      template_id?: string;
      send?: boolean;
    },
  ) {
    return this.messagingService.createBroadcast(req.user.sub || req.user.id || req.user.userId, body);
  }

  @Patch('broadcasts/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Send a draft broadcast' })
  async sendBroadcast(@Param('id') id: string) {
    return this.messagingService.sendBroadcast(id);
  }

  @Delete('broadcasts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a draft broadcast' })
  async deleteBroadcast(@Param('id') id: string) {
    return this.messagingService.deleteBroadcast(id);
  }

  // ─── TAB 3: TEMPLATES ────────────────────────────

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all message templates' })
  @ApiQuery({ name: 'category', required: false })
  async listTemplates(@Query('category') category?: string) {
    return this.messagingService.listTemplates({ category });
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get template details' })
  async getTemplate(@Param('id') id: string) {
    return this.messagingService.getTemplate(id);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a message template' })
  async createTemplate(
    @Req() req: any,
    @Body() body: { name: string; category?: string; subject?: string; body: string },
  ) {
    return this.messagingService.createTemplate(req.user.sub || req.user.id || req.user.userId, body);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update a template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; category?: string; subject?: string; body?: string },
  ) {
    return this.messagingService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a template' })
  async deleteTemplate(@Param('id') id: string) {
    return this.messagingService.deleteTemplate(id);
  }
}