import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List comments with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in comment content',
  })
  @ApiQuery({
    name: 'discussion_id',
    required: false,
    description: 'Filter by discussion',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filter by author',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.commentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID with replies' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin', 'editor', 'author', 'contributor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment or reply' })
  create(@Body() body: any) {
    return this.commentsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.commentsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}
