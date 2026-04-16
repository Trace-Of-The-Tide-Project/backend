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
import { WriterProfileService } from './writer-profile.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@ApiTags('Writer Profiles')
@Controller('writers')
export class WriterProfileController {
  constructor(private readonly writerService: WriterProfileService) {}

  @Get()
  @ApiOperation({ summary: 'List all writer profiles' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: any) {
    return this.writerService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured writers for the homepage strip' })
  findFeatured() {
    return this.writerService.findFeatured();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get writer profile by ID' })
  findOne(@Param('id') id: string) {
    return this.writerService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get writer profile by user ID' })
  findByUserId(@Param('userId') userId: string) {
    return this.writerService.findByUserId(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a writer profile' })
  create(@Body() body: any) {
    return this.writerService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a writer profile' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.writerService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a writer profile' })
  remove(@Param('id') id: string) {
    return this.writerService.remove(id);
  }
}
