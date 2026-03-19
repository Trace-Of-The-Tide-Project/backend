import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { File } from './models/file.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';

@Injectable()
export class FilesService extends BaseService<File> {
  private readonly defaultInclude = [
    { model: Contribution, attributes: ['id', 'title', 'status'] },
    {
      model: User,
      as: 'uploader',
      attributes: ['id', 'username', 'full_name'],
    },
  ];

  constructor(@InjectModel(File) private readonly fileModel: typeof File) {
    super(fileModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['file_name', 'mime_type'],
      order: [['upload_date', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findByContribution(contributionId: string) {
    return this.fileModel.findAll({
      where: { contribution_id: contributionId },
      include: this.defaultInclude,
      order: [['upload_date', 'DESC']],
    });
  }

  // remove inherited from BaseService
}
