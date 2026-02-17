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

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() body: CreateRoleDto) {
    return this.rolesService.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.rolesService.findAll(query, { searchableFields: ['name'] });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Patch(':id/role')
  @Roles('admin')
  updateUserRole(@Param('id') userId: string, @Body('role') roleName: string) {
    return this.rolesService.assignRole(userId, roleName);
  }
}
