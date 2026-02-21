import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { User } from './models/user.model';
import { UserRole } from './models/user-role.model';
import { UserProfile } from './models/user-profile.model';
import { Role } from '../roles/models/role.model';

@Injectable()
export class UsersService extends BaseService<User> {
  private readonly defaultInclude = [
    {
      model: UserRole,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    },
    UserProfile,
  ];

  constructor(@InjectModel(User) private readonly userModel: typeof User) {
    super(userModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['username', 'full_name', 'email'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const user = await this.userModel.findByPk(id, {
      include: this.defaultInclude,
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required');
    const user = await this.userModel.findOne({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const userRoles = await UserRole.findAll({
      where: { user_id: userId },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
    return userRoles
      .map((ur) => (ur.toJSON() as any).role?.name)
      .filter(Boolean);
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      include: [UserProfile],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    let profile = await UserProfile.findOne({
      where: { user_id: userId },
    });

    if (profile) {
      await profile.update(data);
    } else {
      profile = await UserProfile.create({
        user_id: userId,
        ...data,
      } as any);
    }

    return profile;
  }
}