import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Collective } from './models/collective.model';
import { CollectiveMember } from './models/collective-member.model';
import { User } from '../users/models/user.model';

@Injectable()
export class CollectivesService {
  constructor(
    @InjectModel(Collective) private readonly collectiveModel: typeof Collective,
    @InjectModel(CollectiveMember) private readonly memberModel: typeof CollectiveMember,
  ) {}

  async create(data: Partial<Collective>) {
    return this.collectiveModel.create(data as any);
  }

  async findAll() {
    return this.collectiveModel.findAll({
      include: [{ model: CollectiveMember, include: [User] }],
    });
  }

  async findOne(id: string) {
    const collective = await this.collectiveModel.findByPk(id, {
      include: [{ model: CollectiveMember, include: [User] }],
    });
    if (!collective) throw new NotFoundException(`Collective ${id} not found`);
    return collective;
  }

  async update(id: string, data: any) {
    const [affected] = await this.collectiveModel.update(data, { where: { id } });
    if (!affected) throw new NotFoundException(`Collective ${id} not found`);
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleted = await this.collectiveModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Collective ${id} not found`);
    return { message: `Collective ${id} deleted successfully` };
  }

  async addMember(collectiveId: string, userId: string, role = 'member') {
    return this.memberModel.create({
      collective_id: collectiveId,
      user_id: userId,
      role,
      joined_at: new Date(),
    } as any );
  }
}
