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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a role (admin only)' })
  create(@Body() body: CreateRoleDto) {
    return this.rolesService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  findAll(@Query() query: any) {
    return this.rolesService.findAll(query, { searchableFields: ['name'] });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a role (admin only)' })
  update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a role (admin only)' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Patch('assign/:userId')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign a role to a user (admin only)' })
  assignRole(
    @Param('userId') userId: string,
    @Body('role') roleName: string,
  ) {
    return this.rolesService.assignRole(userId, roleName);
  }
}