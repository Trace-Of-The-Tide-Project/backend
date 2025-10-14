import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { AuditTrailsService } from './audit-trails.service';

@Controller('audit-trails')
export class AuditTrailsController {
  constructor(private readonly auditService: AuditTrailsService) {}

  @Post()
  create(@Body() body: any) {
    return this.auditService.create(body);
  }

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditService.remove(id);
  }
}
