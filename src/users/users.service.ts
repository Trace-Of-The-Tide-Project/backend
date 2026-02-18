import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from './models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from 'src/roles/models/role.model';
import { UserRole } from './models/user-role.model';
import { BaseService } from 'src/common/base.service';
@Injectable()
export class UsersService extends BaseService<User> {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {
    super(userModel);
  }


  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required');
    const user = await this.userModel.findOne({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findOne(id: string, options?: any): Promise<User> {
    const user = await super.findOne(id, options);
    return user;
  }

  async findAll(query: any = {}, options: any = {}): Promise<any> {
    const result = await super.findAll(query, {
      ...options,
      attributes: { exclude: ['password'] },
    });
    return result;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await UserRole.findAll({
      where: { user_id: userId },
      include: [{ model: Role, as: 'role' }],
    });
    return userRoles
      .map((ur) => (ur.toJSON() as any).role?.name)
      .filter(Boolean);
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      include: ['profile'],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user.profile;
  }
}