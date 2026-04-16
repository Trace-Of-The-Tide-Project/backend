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
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MagazineIssueService } from './magazine-issue.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@ApiTags('Magazine Issues')
@Controller('magazine-issues')
export class MagazineIssueController {
  constructor(private readonly issueService: MagazineIssueService) {}

  @Get()
  @ApiOperation({ summary: 'List all magazine issues' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'magazine_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'kind', required: false })
  findAll(@Query() query: any) {
    return this.issueService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  findOne(@Param('id') id: string) {
    return this.issueService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get issue by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.issueService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a magazine issue' })
  create(@Body() body: any) {
    return this.issueService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a magazine issue' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.issueService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a magazine issue' })
  remove(@Param('id') id: string) {
    return this.issueService.remove(id);
  }
}
