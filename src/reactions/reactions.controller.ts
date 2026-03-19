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
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  // ─── Public ────────────────────────────────────────────

  @Get('comment/:commentId')
  @ApiOperation({
    summary: 'Get reaction summary for a comment',
    description:
      'Returns total count and breakdown by type (like, love, wow, etc.) with user info.',
  })
  getCommentReactions(@Param('commentId') commentId: string) {
    return this.reactionsService.getCommentReactions(commentId);
  }

  @Get()
  @ApiOperation({ summary: 'List all reactions with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['like', 'love', 'wow', 'sad', 'angry'],
  })
  @ApiQuery({
    name: 'comment_id',
    required: false,
    description: 'Filter by comment UUID',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filter by user UUID',
  })
  findAll(@Query() query: any) {
    return this.reactionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reaction by ID' })
  findOne(@Param('id') id: string) {
    return this.reactionsService.findOne(id);
  }

  // ─── Authenticated ─────────────────────────────────────

  @Post('toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle a reaction on a comment',
    description:
      'Same type twice = removes reaction (unlike). Different type = switches. New = creates. Body: { user_id, comment_id, type }',
  })
  toggle(@Body() body: { user_id: string; comment_id: string; type: string }) {
    return this.reactionsService.toggleReaction(
      body.user_id,
      body.comment_id,
      body.type,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a reaction by ID' })
  remove(@Param('id') id: string) {
    return this.reactionsService.remove(id);
  }
}
