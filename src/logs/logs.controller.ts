import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'List activity logs with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in action and entity_type',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
  })
  @ApiQuery({
    name: 'entity_type',
    required: false,
    description: 'Filter by entity type (User, Contribution, etc.)',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filter by user UUID',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.logsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single log entry by ID' })
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a log entry' })
  remove(@Param('id') id: string) {
    return this.logsService.remove(id);
  }
}
