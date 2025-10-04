import { Roles } from './../auth/jwt/roles.decorator';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './models/user.model';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from 'src/roles/models/role.model';
import { UserRole } from './models/user-role.model';
import { validate as isUUID } from 'uuid';
import { json } from 'sequelize';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async create(createUserDto: any) {
    try {
      return await this.userModel.create(createUserDto as any);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll() {
    return await this.userModel.findAll();
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userModel.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await UserRole.findAll({
      where: { user_id: userId },
      include: [Role],
    });

    const roles = userRoles
      .map((ur) => (ur.toJSON() as any).role?.name)
      .filter(Boolean);

    return roles;
  }

  async update(id: string, updateUserDto: any) {
    const [affectedCount] = await this.userModel.update(updateUserDto as any, {
      where: { id },
    });
    if (affectedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { message: `User ${id} updated successfully` };
  }

  async remove(id: string) {
    const deletedCount = await this.userModel.destroy({ where: { id } });
    if (deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { message: `User ${id} deleted successfully` };
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      include: ['profile'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user.profile;
  }
}
