import { Injectable } from '@nestjs/common';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { Op } from 'sequelize';
import { Contribution } from 'src/contributions/models/contribution.model';
import { File } from 'src/files/models/file.model';

@Injectable()
export class DashboardService {
  async getUsers(filters: {
    role?: string;
    status?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const include: any[] = [
      {
        model: UserRole,
        include: [
          {
            model: Role,
            where: filters.role ? { name: filters.role } : undefined,
          },
        ],
      },
    ];

    const { rows, count } = await User.findAndCountAll({
      where,
      include,
      limit: filters.limit,
      offset: filters.offset,
    });

    return { data: rows, total: count };
  }

  async getStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const adminUsers = await UserRole.count({
      include: [{ model: Role, where: { name: 'admin' } }],
    });

    const rolesCount = await Role.count();
    const totalContributions = await Contribution.count();
    const totalFiles = await File.count();

    return {
      users: { total: totalUsers, active: activeUsers, admins: adminUsers },
      roles: rolesCount,
      contributions: totalContributions,
      files: totalFiles,
    };
  }
}
