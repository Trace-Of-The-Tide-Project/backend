import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  create(@Body() body: any) {
    return this.donationsService.create(body);
  }

  @Get()
  findAll() {
    return this.donationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donationsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.donationsService.remove(id);
  }
}
