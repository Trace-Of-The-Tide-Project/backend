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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OpenCallsService } from './open-call.service';
import { CreateOpenCallDto, UpdateOpenCallDto } from './dto/open-call.dto';
import { JoinOpenCallDto } from './dto/join-open-call.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'audio/mpeg',
  'video/mp4',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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
    description: "Returns only open calls that haven't passed their deadline.",
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title, description, category',
  })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['article', 'video', 'audio', 'slide'],
  })
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
  //  PARTICIPANT ACTIONS — Public (guest allowed)
  // ═══════════════════════════════════════════════════════════

  @Post(':id/join')
  @ApiOperation({
    summary: 'Join an open call (public — guest allowed)',
    description:
      'Submit participation with personal info and optional file uploads. Sends confirmation email.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Successfully joined' })
  @ApiResponse({
    status: 400,
    description: 'Call is closed or deadline passed',
  })
  @ApiResponse({ status: 409, description: 'Already a participant' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/open-calls',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(`File type ${file.mimetype} is not allowed`) as any,
            false,
          );
        }
      },
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  join(
    @Param('id') id: string,
    @Body() dto: JoinOpenCallDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // If authenticated, attach user_id
    if (req.user?.sub) {
      dto.user_id = req.user.sub;
    }
    return this.openCallsService.joinOpenCall(id, dto, files || []);
  }

  @Post(':id/apply-editor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Apply for editor role via an open call',
    description: 'Creates a pending editor application linked to this open call.',
  })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 409, description: 'Already applied or already an editor' })
  applyForEditor(@Param('id') id: string, @Req() req: any) {
    return this.openCallsService.applyForEditor(id, req.user.sub);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw from an open call' })
  leave(@Param('id') id: string, @Req() req: any) {
    return this.openCallsService.leaveOpenCall(id, req.user.sub);
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN ENDPOINTS — Open call management
  // ═══════════════════════════════════════════════════════════

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get open call statistics (admin dashboard)' })
  getStats() {
    return this.openCallsService.getStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all open calls (admin)',
    description:
      'Returns all calls regardless of status — for admin dashboard.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['open', 'closed', 'draft'],
  })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['article', 'video', 'audio', 'slide'],
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.openCallsService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new open call' })
  create(@Body() dto: CreateOpenCallDto, @Req() req: any) {
    return this.openCallsService.createOpenCall({
      ...dto,
      created_by: dto.created_by || req.user.sub,
    } as any);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an open call' })
  update(@Param('id') id: string, @Body() dto: UpdateOpenCallDto) {
    return this.openCallsService.updateOpenCall(id, dto as any);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close an open call' })
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
  @ApiOperation({ summary: 'List participants for an open call' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'approved', 'rejected', 'withdrawn'],
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['participant', 'contributor', 'reviewer'],
  })
  getParticipants(@Param('id') id: string, @Query() query: any) {
    return this.openCallsService.getParticipants(id, query);
  }

  @Patch(':id/participants/:participantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update participant status or role' })
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
  @ApiOperation({ summary: 'Link a contribution to a participant' })
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
