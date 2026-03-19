import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List groups with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in name and description',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.groupsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID with members' })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List all members of a group' })
  getMembers(@Param('id') id: string) {
    return this.groupsService.getMembers(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new group' })
  create(@Body() body: any) {
    return this.groupsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a group' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.groupsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a group' })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a member to a group' })
  addMember(@Param('id') groupId: string, @Body() body: any) {
    return this.groupsService.addMember(groupId, body.user_id, body.role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from a group' })
  removeMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(groupId, userId);
  }
}
