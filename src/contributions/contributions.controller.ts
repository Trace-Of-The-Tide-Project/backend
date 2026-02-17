import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: any) {
    return this.contributionsService.create(body);
  }

  @Get()
  findAll() {
    return this.contributionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contributionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.contributionsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.contributionsService.remove(id);
  }
}
