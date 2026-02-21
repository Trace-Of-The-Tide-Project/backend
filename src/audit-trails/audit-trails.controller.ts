import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditTrailsService } from './audit-trails.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Audit Trails')
@Controller('audit-trails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AuditTrailsController {
  constructor(private readonly auditService: AuditTrailsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit trail entries with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in action and entity_type' })
  @ApiQuery({ name: 'action', required: false, enum: ['CREATE', 'UPDATE', 'DELETE'] })
  @ApiQuery({ name: 'entity_type', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by user UUID' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'timestamp' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an audit trail entry by ID' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an audit trail entry' })
  remove(@Param('id') id: string) {
    return this.auditService.remove(id);
  }
}