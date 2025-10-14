import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CollectivesService } from './collectives.service';

@Controller('collectives')
export class CollectivesController {
  constructor(private readonly collectivesService: CollectivesService) {}

  @Post()
  create(@Body() body: any) {
    return this.collectivesService.create(body);
  }

  @Get()
  findAll() {
    return this.collectivesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectivesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.collectivesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectivesService.remove(id);
  }

  @Post(':id/members')
  addMember(@Param('id') collectiveId: string, @Body() body: any) {
    return this.collectivesService.addMember(collectiveId, body.user_id, body.role);
  }
}
