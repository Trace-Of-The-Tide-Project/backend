import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OpenCall } from './models/open-call.model';
import { Participant } from './models/participant.model';

@Injectable()
export class OpenCallsService {
  constructor(
    @InjectModel(OpenCall) private openCallModel: typeof OpenCall,
    @InjectModel(Participant) private participantModel: typeof Participant,
  ) {}

  async createOpenCall(data: Partial<OpenCall>) {
    return this.openCallModel.create(data as any);
  }

  async findAllOpenCalls() {
    return this.openCallModel.findAll({ include: [Participant] });
  }

  async findOne(id: string) {
    const call = await this.openCallModel.findByPk(id, { include: [Participant] });
    if (!call) throw new NotFoundException(`Open Call ${id} not found`);
    return call;
  }

  async joinOpenCall(data: Partial<Participant>) {
    return this.participantModel.create({ ...data, join_date: new Date(), status: 'joined' } as any);
  }
}
