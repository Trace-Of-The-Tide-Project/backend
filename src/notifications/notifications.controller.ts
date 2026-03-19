import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all notifications with filters and pagination',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in message and type',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['unread', 'read'] })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by type (system, review, update)',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'created_at' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.notificationsService.findAll(query);
  }

  // Static routes before :id param routes
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a specific user' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['unread', 'read'] })
  findByUser(@Param('userId') userId: string, @Query() query: any) {
    return this.notificationsService.findByUser(userId, query);
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for a user' })
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a notification (admin only)' })
  create(@Body() body: any) {
    return this.notificationsService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
