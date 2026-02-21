import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OpenCallsService } from './open-call.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Open Calls')
@Controller('open-calls')
export class OpenCallsController {
  constructor(private readonly openCallsService: OpenCallsService) {}

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC ENDPOINTS — No auth required
  // ═══════════════════════════════════════════════════════════

  @Get('active')
  @ApiOperation({
    summary: 'List active/open calls (public)',
    description: 'Returns only open calls that haven\'t passed their deadline. Used on the public-facing Open Calls page.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title, description, category' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (Oral History, Photography, etc.)' })
  findActive(@Query() query: any) {
    return this.openCallsService.findActiveOpenCalls(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get open call details (public)',
    description: 'Returns full details with creator info and participant list.',
  })
  findOne(@Param('id') id: string) {
    return this.openCallsService.findOne(id);
  }

  // ═══════════════════════════════════════════════════════════
  //  PARTICIPANT ACTIONS — Authenticated users
  // ═══════════════════════════════════════════════════════════

  @Post(':id/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Join an open call',
    description: 'Submit participation with personal info (name, email, phone, experience, about, country, city). Validates the call is still open and the deadline hasn\'t passed.',
  })
  join(@Param('id') id: string, @Body() body: any) {
    return this.openCallsService.joinOpenCall(id, body);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw from an open call' })
  leave(@Param('id') id: string, @Body('user_id') userId: string) {
    return this.openCallsService.leaveOpenCall(id, userId);
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN ENDPOINTS — Open call management
  // ═══════════════════════════════════════════════════════════

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all open calls (admin)',
    description: 'Returns all calls regardless of status — for admin dashboard.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'closed', 'draft'] })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.openCallsService.findAll(query);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get open call statistics (admin dashboard)' })
  getStats() {
    return this.openCallsService.getStats();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new open call',
    description: 'Creates a themed call for content submissions. Fields: title, description, category, timeline_start, timeline_end, created_by.',
  })
  create(@Body() body: any) {
    return this.openCallsService.createOpenCall(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an open call' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.openCallsService.updateOpenCall(id, body);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Close an open call',
    description: 'Stops accepting new participants. Existing submissions remain.',
  })
  close(@Param('id') id: string) {
    return this.openCallsService.closeOpenCall(id);
  }

  @Patch(':id/reopen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reopen a closed call (admin only)' })
  reopen(@Param('id') id: string) {
    return this.openCallsService.reopenOpenCall(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an open call (admin only)' })
  remove(@Param('id') id: string) {
    return this.openCallsService.deleteOpenCall(id);
  }

  // ═══════════════════════════════════════════════════════════
  //  PARTICIPANT MANAGEMENT — Admin actions
  // ═══════════════════════════════════════════════════════════

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List participants for an open call',
    description: 'Paginated list with user info and linked contributions.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'approved', 'rejected', 'withdrawn'] })
  @ApiQuery({ name: 'role', required: false, enum: ['participant', 'contributor', 'reviewer'] })
  getParticipants(@Param('id') id: string, @Query() query: any) {
    return this.openCallsService.getParticipants(id, query);
  }

  @Patch(':id/participants/:participantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update participant status or role',
    description: 'Approve, reject, or change the role of a participant.',
  })
  updateParticipant(
    @Param('id') openCallId: string,
    @Param('participantId') participantId: string,
    @Body() body: { status?: string; role?: string },
  ) {
    return this.openCallsService.updateParticipant(
      openCallId,
      participantId,
      body,
    );
  }

  @Patch(':id/participants/:participantId/link-contribution')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link a contribution to a participant',
    description: 'Connects a submitted contribution to their participation entry.',
  })
  linkContribution(
    @Param('id') openCallId: string,
    @Param('participantId') participantId: string,
    @Body('contribution_id') contributionId: string,
  ) {
    return this.openCallsService.linkContribution(
      openCallId,
      participantId,
      contributionId,
    );
  }

  @Delete(':id/participants/:participantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a participant (admin only)' })
  removeParticipant(
    @Param('id') openCallId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.openCallsService.removeParticipant(openCallId, participantId);
  }
}