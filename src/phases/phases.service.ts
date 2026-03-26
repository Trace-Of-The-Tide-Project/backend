import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Phase } from './models/phase.model';
import { Collective } from '../collectives/models/collective.model';

@Injectable()
export class PhasesService extends BaseService<Phase> {
  private readonly defaultInclude = [
    { model: Collective, attributes: ['id', 'name'], required: false },
  ];

  constructor(
    @InjectModel(Phase) private readonly phaseModel: typeof Phase,
  ) {
    super(phaseModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['name', 'status'],
      order: [['order', 'ASC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findByCollective(collectiveId: string, query: any = {}) {
    return super.findAll(
      { ...query, collective_id: collectiveId },
      {
        include: this.defaultInclude,
        searchableFields: ['name', 'status'],
        order: [['order', 'ASC']],
      },
    );
  }

  async reorder(collectiveId: string, phaseIds: string[]) {
    for (let i = 0; i < phaseIds.length; i++) {
      await this.phaseModel.update(
        { order: i + 1 },
        { where: { id: phaseIds[i], collective_id: collectiveId } },
      );
    }
    return this.findByCollective(collectiveId);
  }
}
