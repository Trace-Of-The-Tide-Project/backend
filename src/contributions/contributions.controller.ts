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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ContributionsService } from './contributions.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import {
  UpdateContributionDto,
  UpdateContributionStatusDto,
} from './dto/update-contribution.dto';
import {
  CreateContributionTypeDto,
  UpdateContributionTypeDto,
} from './dto/contribution-type.dto';
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

// Allowed MIME types for contribution file uploads
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

@ApiTags('Contributions')
@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new contribution with optional file uploads',
    description:
      'Works for both authenticated and guest users. If authenticated, user_id is auto-filled from JWT token. Accepts multipart/form-data with files.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Contribution created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/contributions',
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
            new Error(
              `File type ${file.mimetype} is not allowed. Allowed: JPG, PNG, PDF, MP3, MP4, DOC`,
            ) as any,
            false,
          );
        }
      },
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  create(
    @Body() dto: CreateContributionDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // If authenticated, use token's user_id
    const userId = req.user?.sub || null;
    return this.contributionsService.createWithFiles(dto, files || [], userId);
  }

  @Get('types')
  @ApiOperation({ summary: 'List all contribution types (public)' })
  @ApiResponse({ status: 200, description: 'List of contribution types' })
  findAllTypes() {
    return this.contributionsService.findAllTypes();
  }

  @Get('types/:id')
  @ApiOperation({ summary: 'Get a single contribution type by ID' })
  findOneType(@Param('id') id: string) {
    return this.contributionsService.findOneType(id);
  }

  @Post('types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new contribution type (admin only)' })
  @ApiResponse({ status: 201, description: 'Contribution type created' })
  createType(@Body() dto: CreateContributionTypeDto) {
    return this.contributionsService.createType(dto);
  }

  @Patch('types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a contribution type (admin only)' })
  updateType(@Param('id') id: string, @Body() dto: UpdateContributionTypeDto) {
    return this.contributionsService.updateType(id, dto);
  }

  @Delete('types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a contribution type (admin only)' })
  removeType(@Param('id') id: string) {
    return this.contributionsService.removeType(id);
  }

  @Get()
  @ApiOperation({
    summary: 'List contributions with filtering, search, and pagination',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'pending', 'published', 'flagged'],
  })
  @ApiQuery({
    name: 'type_id',
    required: false,
    description: 'Filter by contribution type UUID',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filter by author UUID',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.contributionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get a single contribution by ID with files, type, user, and collections',
  })
  findOne(@Param('id') id: string) {
    return this.contributionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a contribution' })
  update(@Param('id') id: string, @Body() dto: UpdateContributionDto) {
    return this.contributionsService.update(id, dto as any);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contribution status (admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContributionStatusDto,
  ) {
    return this.contributionsService.update(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a contribution' })
  remove(@Param('id') id: string) {
    return this.contributionsService.remove(id);
  }
}
