import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OpenCall } from './models/open-call.model';
import { Participant } from './models/participant.model';
import { BaseService } from '../common/base.service'; // المسار حسب مكانك

@Injectable()
export class OpenCallsService extends BaseService<OpenCall> {
  constructor(
    @InjectModel(OpenCall) private readonly openCallModel: typeof OpenCall,
    @InjectModel(Participant)
    private readonly participantModel: typeof Participant,
  ) {
    super(openCallModel);
  }

  async findAllOpenCalls(query?: any) {
    return super.findAll(query, { include: [Participant] });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: [Participant] });
  }

  async joinOpenCall(data: Partial<Participant>) {
    return this.participantModel.create({
      ...data,
      join_date: new Date(),
      status: 'joined',
    } as any);
  }

  async createOpenCall(data: Partial<OpenCall>) {
    return super.create(data);
  }
}
