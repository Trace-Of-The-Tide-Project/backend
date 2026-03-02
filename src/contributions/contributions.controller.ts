import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Contributions')
@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new contribution' })
  create(@Body() body: any, @Req() req: any) {
    return this.contributionsService.create({ ...body, user_id: req.user.sub });
  }

  @Get()
  @ApiOperation({ summary: 'List contributions with filtering, search, and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and description' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'pending', 'published', 'flagged'] })
  @ApiQuery({ name: 'type_id', required: false, description: 'Filter by contribution type UUID' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by author UUID' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.contributionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contribution by ID' })
  findOne(@Param('id') id: string) {
    return this.contributionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a contribution' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.contributionsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a contribution' })
  remove(@Param('id') id: string) {
    return this.contributionsService.remove(id);
  }
}