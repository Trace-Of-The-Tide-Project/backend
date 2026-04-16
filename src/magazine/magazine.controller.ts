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
import { MagazineService } from './magazine.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@ApiTags('Magazines')
@Controller('magazines')
export class MagazineController {
  constructor(private readonly magazineService: MagazineService) {}

  @Get()
  @ApiOperation({ summary: 'List all magazines' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query() query: any) {
    return this.magazineService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get magazine by ID' })
  findOne(@Param('id') id: string) {
    return this.magazineService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get magazine by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.magazineService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a magazine' })
  create(@Body() body: any) {
    return this.magazineService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a magazine' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.magazineService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a magazine' })
  remove(@Param('id') id: string) {
    return this.magazineService.remove(id);
  }
}
