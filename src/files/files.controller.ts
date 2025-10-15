import { Controller, Get, Post, Param, Body, Delete } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('files')
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
