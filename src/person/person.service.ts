import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PersonProfile } from './models/person-profile.model';
import { BiographicalCard } from './models/biographical-card.model';
import { LifeEvent } from './models/life-event.model';
import { TimelineEvent } from './models/timeline-event.model';

@Injectable()
export class PersonService {
  constructor(
    @InjectModel(PersonProfile) private profileModel: typeof PersonProfile,
    @InjectModel(BiographicalCard) private cardModel: typeof BiographicalCard,
    @InjectModel(LifeEvent) private lifeEventModel: typeof LifeEvent,
    @InjectModel(TimelineEvent) private timelineModel: typeof TimelineEvent,
  ) {}

  async createProfile(data: Partial<PersonProfile>) {
    return this.profileModel.create(data as any);
  }

  async findAllProfiles() {
    return this.profileModel.findAll({ include: [BiographicalCard, LifeEvent, TimelineEvent] });
  }

  async findProfile(id: string) {
    const profile = await this.profileModel.findByPk(id, { include: [BiographicalCard, LifeEvent, TimelineEvent] });
    if (!profile) throw new NotFoundException(`Profile ${id} not found`);
    return profile;
  }
}
