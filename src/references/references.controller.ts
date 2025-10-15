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
import { ReferencesService } from './references.service';

@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Post()
  create(@Body() body: any) {
    return this.referencesService.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.referencesService.findAll(query, {
      searchableFields: ['title', 'author'],
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.referencesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.referencesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referencesService.remove(id);
  }
}
