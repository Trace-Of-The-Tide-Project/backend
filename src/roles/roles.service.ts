import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './models/role.model';
import { UserRole } from '../users/models/user-role.model';

import { validate as isUUID } from 'uuid';
import { Op } from 'sequelize';

@Injectable()
export class RolesService {
  async create(createRoleDto: CreateRoleDto) {
    const checkRole = await Role.findOne({
      where: { name: createRoleDto.name },
    });
    if (checkRole) {
      throw new Error('Role already exists');
    }
    return Role.create(createRoleDto as any);
  }

  findAll() {
    return Role.findAll();
  }

  findOne(id: string) {
    return Role.findOne({ where: { id } });
  }

  update(id: string, updateRoleDto: UpdateRoleDto) {
    const checkRole = Role.findOne({ where: { id } });
    if (!checkRole) {
      throw new Error('Role not found');
    }
    return Role.update(updateRoleDto, { where: { id } });
  }

  remove(id: string) {
    const checkRole = Role.findOne({ where: { id } });
    if (!checkRole) {
      throw new Error('Role not found');
    }
    return Role.destroy({ where: { id } });
  }

  // change role for user
  async assignRole(userId: string, roleName: string) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await UserRole.destroy({ where: { user_id: userId } });
    await UserRole.create({ user_id: userId, role_id: role.id } as any);

    return { message: `Role ${roleName} assigned successfully` };
  }
}
