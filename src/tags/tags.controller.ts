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
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'List tags with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by tag name' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'name' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.tagsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a tag' })
  create(@Body() body: any) {
    return this.tagsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tag' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.tagsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag (admin only)' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}