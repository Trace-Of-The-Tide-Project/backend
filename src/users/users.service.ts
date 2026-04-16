import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { User } from './models/user.model';
import { UserRole } from './models/user-role.model';
import { UserProfile } from './models/user-profile.model';
import { Role } from '../roles/models/role.model';
import { CreateProfileDto, UpdateProfileDto } from './dto/user-profile.dto';

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
      attributes: { exclude: ['password'] },
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

  async create(data: any) {
    // Auto-generate username from email prefix if not provided
    if (!data.username && data.email) {
      const base = data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      let username = base;
      let suffix = 1;
      while (await this.userModel.findOne({ where: { username } })) {
        username = `${base}${suffix}`;
        suffix++;
      }
      data = { ...data, username };
    }

    const user = await super.create(data);
    // Re-fetch without password to avoid leaking the hash
    return this.findOne(user.id);
  }

  async findOneWithPassword(id: string) {
    const user = await this.userModel.findByPk(id);
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

  async findByUsername(username: string) {
    if (!username) throw new BadRequestException('Username is required');
    const user = await this.userModel.findOne({ where: { username } });
    if (!user)
      throw new NotFoundException(`User with username ${username} not found`);
    return user;
  }

  async findByIdentifier(identifier: string) {
    if (!identifier)
      throw new BadRequestException('Email or username is required');
    // If it looks like an email, search by email; otherwise by username
    const isEmail = identifier.includes('@');
    const user = await this.userModel.findOne({
      where: isEmail ? { email: identifier } : { username: identifier },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const userRoles = await UserRole.findAll({
      where: { user_id: userId },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
    });
    return userRoles.map((ur) => ur.toJSON().role?.name).filter(Boolean);
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findByPk(userId, {
      include: [UserProfile],
      attributes: { exclude: ['password'] },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user;
  }

  async createProfile(userId: string, data: CreateProfileDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const existing = await UserProfile.findOne({ where: { user_id: userId } });
    if (existing)
      throw new ConflictException('Profile already exists. Use PATCH to update.');

    if (data.full_name) await user.update({ full_name: data.full_name });

    const { full_name, ...profileData } = data;
    return UserProfile.create({ user_id: userId, ...profileData } as any);
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (data.full_name) await user.update({ full_name: data.full_name });

    const { full_name, ...profileData } = data;
    let profile = await UserProfile.findOne({ where: { user_id: userId } });

    if (profile) {
      await profile.update(profileData as any);
    } else {
      profile = await UserProfile.create({
        user_id: userId,
        ...profileData,
      } as any);
    }

    return profile;
  }

  async updateAvatar(userId: string, filePath: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    let profile = await UserProfile.findOne({
      where: { user_id: userId },
    });

    if (profile) {
      await profile.update({ avatar: filePath });
    } else {
      profile = await UserProfile.create({
        user_id: userId,
        avatar: filePath,
      } as any);
    }

    return profile;
  }
}
