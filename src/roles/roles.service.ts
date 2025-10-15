import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './models/role.model';
import { UserRole } from '../users/models/user-role.model';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class RolesService extends BaseService<Role> {
  constructor(@InjectModel(Role) private readonly roleModel: typeof Role) {
    super(roleModel);
  }

  async create(data: any) {
    const existing = await this.model.findOne({ where: { name: data.name } });
    if (existing) throw new BadRequestException('Role already exists');
    return this.model.create(data);
  }

  async assignRole(userId: string, roleName: string) {
    const role = await this.model.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    await UserRole.destroy({ where: { user_id: userId } });
    await UserRole.create({ user_id: userId, role_id: role.id } as any);

    return { message: `Role ${roleName} assigned successfully` };
  }
}
