import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { File } from '../files/models/file.model';
import { Contribution } from '../contributions/models/contribution.model';

@Injectable()
export class FilesService {
  constructor(@InjectModel(File) private fileModel: typeof File) {}

  async create(data: Partial<File>): Promise<File> {
    return this.fileModel.create(data as any);
  }

  async findAll(): Promise<File[]> {
    return this.fileModel.findAll({ include: [Contribution] });
  }

  async findById(id: string): Promise<File> {
    const file = await this.fileModel.findByPk(id, { include: [Contribution] });
    if (!file) throw new NotFoundException(`File with ID ${id} not found`);
    return file;
  }

  async findByContribution(contributionId: string): Promise<File[]> {
    return this.fileModel.findAll({
      where: { contribution_id: contributionId },
      include: [Contribution],
    });
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.fileModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`File with ID ${id} not found`);
  }
}
