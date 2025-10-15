import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // ===== CRUD قياسي =====
  @Post()
  create(@Body() body: any) {
    return this.tagsService.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.tagsService.findAll(query, { searchableFields: ['name'] });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tagsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
