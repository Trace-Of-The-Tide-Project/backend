import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a donation' })
  create(@Body() body: any) {
    return this.donationsService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List donations with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'completed', 'failed'] })
  @ApiQuery({ name: 'type', required: false, enum: ['one-time', 'monthly'] })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by donor UUID' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'date' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.donationsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a donation by ID' })
  findOne(@Param('id') id: string) {
    return this.donationsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a donation' })
  remove(@Param('id') id: string) {
    return this.donationsService.remove(id);
  }
}