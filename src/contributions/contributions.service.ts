import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Contribution } from './models/contribution.model';
import { ContributionType } from './models/contribution-type.model';
import { File } from '../files/models/file.model';
import { Collection } from '../collections/models/collection.model';
import { User } from '../users/models/user.model';
import { CreateContributionDto } from './dto/create-contribution.dto';
import {
  CreateContributionTypeDto,
  UpdateContributionTypeDto,
} from './dto/contribution-type.dto';

@Injectable()
export class ContributionsService extends BaseService<Contribution> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
    ContributionType,
    File,
    Collection,
  ];

  constructor(
    @InjectModel(Contribution)
    private readonly contributionModel: typeof Contribution,
    @InjectModel(ContributionType)
    private readonly contributionTypeModel: typeof ContributionType,
    @InjectModel(File)
    private readonly fileModel: typeof File,
  ) {
    super(contributionModel);
  }

  // ── Contribution Types CRUD ──────────────────────────────

  async findAllTypes() {
    return this.contributionTypeModel.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']],
    });
  }

  async findOneType(id: string) {
    const type = await this.contributionTypeModel.findByPk(id);
    if (!type) throw new NotFoundException(`ContributionType ${id} not found`);
    return type;
  }

  async createType(dto: CreateContributionTypeDto) {
    return this.contributionTypeModel.create(dto as any);
  }

  async updateType(id: string, dto: UpdateContributionTypeDto) {
    const type = await this.findOneType(id);
    await type.update(dto);
    return type;
  }

  async removeType(id: string) {
    const type = await this.findOneType(id);
    await type.destroy();
    return { message: `ContributionType ${id} deleted successfully` };
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async create(data: Partial<Contribution>) {
    return this.contributionModel.create({
      submission_date: new Date(),
      status: 'draft',
      ...data,
    } as any);
  }

  /**
   * Create a contribution with file uploads.
   * Handles both authenticated and guest users.
   */
  async createWithFiles(
    dto: CreateContributionDto,
    files: Express.Multer.File[],
    userId: string | null,
  ) {
    const contribution = await this.contributionModel.create({
      title: dto.title,
      description: dto.description,
      type_id: dto.type_id,
      user_id: userId,
      contributor_name: dto.contributor_name,
      contributor_email: dto.contributor_email,
      contributor_phone: dto.contributor_phone || null,
      phone_number: dto.phone_number || null,
      consent_given: dto.consent_given,
      open_call_id: dto.open_call_id || null,
      submission_date: new Date(),
      status: 'pending',
    } as any);

    // Create file records for uploaded files
    if (files.length > 0) {
      for (const file of files) {
        await this.fileModel.create({
          contribution_id: contribution.id,
          file_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          path: file.path.replace(/\\/g, '/'),
          uploaded_by: userId,
          upload_date: new Date(),
        } as any);
      }
    }

    return this.findOne(contribution.id);
  }

  async update(id: string, data: Partial<Contribution>) {
    return super.update(id, data);
  }
}
