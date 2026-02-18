import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './models/role.model';
import { UserRole } from '../users/models/user-role.model';
import { BaseService } from '../common/base.service';

// Protected role names that cannot be deleted
const PROTECTED_ROLES = ['admin', 'user', 'moderator'];

@Injectable()
export class RolesService extends BaseService<Role> {
  constructor(@InjectModel(Role) private readonly roleModel: typeof Role) {
    super(roleModel);
  }

  async create(data: any) {
    const existing = await this.roleModel.findOne({ where: { name: data.name } });
    if (existing) throw new BadRequestException('Role already exists');
    return this.roleModel.create(data);
  }

  async remove(id: string) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');
    if (PROTECTED_ROLES.includes(role.name)) {
      throw new BadRequestException(`Cannot delete built-in role "${role.name}"`);
    }
    await role.destroy();
    return { message: `Role "${role.name}" deleted successfully` };
  }

  async assignRole(userId: string, roleName: string) {
    const role = await this.roleModel.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role "${roleName}" not found`);

    const existing = await UserRole.findOne({
      where: { user_id: userId, role_id: role.id },
    });
    if (existing) {
      return { message: `User already has role "${roleName}"` };
    }

  
    await UserRole.create({ user_id: userId, role_id: role.id } as any);

    return { message: `Role "${roleName}" assigned successfully` };
  }
}