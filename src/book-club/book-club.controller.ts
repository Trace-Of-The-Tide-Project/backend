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
import { BookClubService } from './book-club.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@ApiTags('Book Club')
@Controller('book-club')
export class BookClubController {
  constructor(private readonly bookClubService: BookClubService) {}

  @Get()
  @ApiOperation({ summary: 'List all book club selections' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'magazine_id', required: false })
  findAll(@Query() query: any) {
    return this.bookClubService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active selections for a magazine' })
  @ApiQuery({ name: 'magazine_id', required: true })
  findActive(@Query('magazine_id') magazineId: string) {
    return this.bookClubService.findActiveByMagazine(magazineId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book club selection by ID' })
  findOne(@Param('id') id: string) {
    return this.bookClubService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a book club selection' })
  create(@Body() body: any) {
    return this.bookClubService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a book club selection' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.bookClubService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book club selection' })
  remove(@Param('id') id: string) {
    return this.bookClubService.remove(id);
  }
}
