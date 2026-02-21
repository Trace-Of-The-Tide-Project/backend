import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor', 'moderator')
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  @ApiOperation({ summary: 'List moderation logs with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in action and reason' })
  @ApiQuery({ name: 'action', required: false, enum: ['approved', 'rejected', 'flagged'] })
  @ApiQuery({ name: 'reviewer_id', required: false, description: 'Filter by reviewer UUID' })
  @ApiQuery({ name: 'contribution_id', required: false, description: 'Filter by contribution UUID' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'created_at' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.moderationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a moderation log by ID' })
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a moderation log entry (flag, approve, reject)' })
  create(@Body() body: any) {
    return this.moderationService.create(body);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a moderation log entry (admin only)' })
  remove(@Param('id') id: string) {
    return this.moderationService.remove(id);
  }
}