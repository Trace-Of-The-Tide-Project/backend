import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { WriterProfile } from './models/writer-profile.model';
import { User } from '../users/models/user.model';

@Injectable()
export class WriterProfileService extends BaseService<WriterProfile> {
  private readonly defaultInclude = [
    {
      model: User,
      attributes: ['id', 'full_name', 'email', 'username'],
    },
  ];

  constructor(
    @InjectModel(WriterProfile)
    private readonly writerModel: typeof WriterProfile,
  ) {
    super(writerModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['pen_name', 'headline', 'bio_long'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findFeatured() {
    return this.writerModel.findAll({
      where: { featured: true },
      include: this.defaultInclude,
      order: [['updatedAt', 'DESC']],
    });
  }

  async findByUserId(userId: string) {
    const profile = await this.writerModel.findOne({
      where: { user_id: userId },
      include: this.defaultInclude,
    });
    if (!profile) throw new BadRequestException('Writer profile not found');
    return profile;
  }

  async create(data: Partial<WriterProfile>) {
    const existing = await this.writerModel.findOne({
      where: { user_id: (data as any).user_id },
    });
    if (existing) throw new BadRequestException('A writer profile already exists for this user');
    return super.create(data);
  }
}
