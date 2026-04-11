import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List files with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in file_name and mime_type',
  })
  @ApiQuery({
    name: 'mime_type',
    required: false,
    description: 'Filter by MIME type',
  })
  @ApiQuery({
    name: 'contribution_id',
    required: false,
    description: 'Filter by contribution UUID',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'upload_date' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.filesService.findAll(query);
  }

  @Get('contribution/:contributionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all files for a specific contribution' })
  findByContribution(@Param('contributionId') contributionId: string) {
    return this.filesService.findByContribution(contributionId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a file by ID' })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a temporary signed URL for a file' })
  async getFileUrl(@Param('id') id: string) {
    const file = await this.filesService.findOne(id);
    const url = await this.storageService.getSignedUrl(file.path);
    return { url };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a file record' })
  create(@Body() data: any) {
    return this.filesService.create(data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
