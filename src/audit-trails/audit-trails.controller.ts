import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuditTrailsService } from './audit-trails.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@Controller('audit-trails')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.auditService.remove(id);
  }
}
