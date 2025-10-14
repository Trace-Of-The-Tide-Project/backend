import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ModerationLog } from './models/moderation-log.model';

@Injectable()
export class ModerationService {
    constructor(
        @InjectModel(ModerationLog)
        private readonly moderationModel: typeof ModerationLog,
    ) { }

    async create(data: Partial<ModerationLog>) {
        return this.moderationModel.create(data as any);
    }

    async findAll() {
        return this.moderationModel.findAll({ include: ['contribution', 'reviewer'] });
    }

    async findOne(id: string) {
        const log = await this.moderationModel.findByPk(id);
        if (!log) throw new NotFoundException(`Moderation log ${id} not found`);
        return log;
    }

    async remove(id: string) {
        const deleted = await this.moderationModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Moderation log ${id} not found`);
        return { message: `Moderation log ${id} deleted successfully` };
    }
}
