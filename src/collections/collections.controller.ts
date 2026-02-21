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
import { CollectionsService } from './collections.service';
import { Collection } from './models/collection.model';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List collections with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'created_date' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.collectionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collection by ID with its contributions' })
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collection' })
  create(@Body() body: Partial<Collection>) {
    return this.collectionsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a collection' })
  update(@Param('id') id: string, @Body() body: Partial<Collection>) {
    return this.collectionsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a collection' })
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}