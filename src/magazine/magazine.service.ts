import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Magazine } from './models/magazine.model';
import { User } from '../users/models/user.model';

@Injectable()
export class MagazineService extends BaseService<Magazine> {
  private readonly defaultInclude = [
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'full_name', 'email'],
    },
  ];

  constructor(
    @InjectModel(Magazine) private readonly magazineModel: typeof Magazine,
  ) {
    super(magazineModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['name', 'tagline', 'slug'],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findBySlug(slug: string) {
    const magazine = await this.magazineModel.findOne({
      where: { slug },
      include: this.defaultInclude,
    });
    if (!magazine) throw new BadRequestException('Magazine not found');
    return magazine;
  }

  async create(data: Partial<Magazine>) {
    const existing = await this.magazineModel.findOne({
      where: { slug: (data as any).slug },
    });
    if (existing) throw new BadRequestException('A magazine with this slug already exists');
    return super.create(data);
  }
}
