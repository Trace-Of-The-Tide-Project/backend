import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  create(@Body() data: any) {
    return this.filesService.create(data);
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get('contribution/:contributionId')
  findByContribution(@Param('contributionId') contributionId: string) {
    return this.filesService.findByContribution(contributionId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
