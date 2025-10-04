import { Controller, Get, Post, Param, Body, Delete } from '@nestjs/common';
import { FilesService } from '../files/files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  create(@Body() data: Partial<File>) {
    return this.filesService.create(data as any);
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findById(id);
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
