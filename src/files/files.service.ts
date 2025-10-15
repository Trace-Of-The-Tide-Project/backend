import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { File } from './models/file.model';
import { Contribution } from '../contributions/models/contribution.model';

@Injectable()
export class FilesService extends BaseService<File> {
  constructor(@InjectModel(File) private readonly fileModel: typeof File) {
    super(fileModel);
  }

  async findAll() {
    return super.findAll([Contribution]);
  }

  async findOne(id: string) {
    const file = await super.findOne(id, [Contribution] as any);
    if (!file) throw new NotFoundException(`File with ID ${id} not found`);
    return file;
  }

  async findByContribution(contributionId: string) {
    return this.fileModel.findAll({
      where: { contribution_id: contributionId },
      include: [Contribution],
    });
  }

  async remove(id: string) {
    const deleted = await this.fileModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`File with ID ${id} not found`);
    return { message: `File ${id} deleted successfully` };
  }
}
