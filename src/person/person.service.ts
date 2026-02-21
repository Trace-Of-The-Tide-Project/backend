import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { PersonProfile } from './models/person-profile.model';
import { BiographicalCard } from './models/biographical-card.model';
import { LifeEvent } from './models/life-event.model';
import { TimelineEvent } from './models/timeline-event.model';
import { User } from '../users/models/user.model';
import { Location } from '../knowledge/models/location.model';
import { Contribution } from '../contributions/models/contribution.model';

@Injectable()
export class PersonService extends BaseService<PersonProfile> {
  private readonly profileInclude = [
    { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
    {
      model: BiographicalCard,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
      ],
    },
    {
      model: LifeEvent,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
        Location,
      ],
      order: [['event_date', 'ASC']],
    },
    {
      model: TimelineEvent,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
        { model: Contribution, attributes: ['id', 'title', 'status'] },
      ],
      order: [['event_date', 'ASC']],
    },
  ];

  private cardBase: BaseService<BiographicalCard>;
  private lifeEventBase: BaseService<LifeEvent>;
  private timelineBase: BaseService<TimelineEvent>;

  constructor(
    @InjectModel(PersonProfile) private profileModel: typeof PersonProfile,
    @InjectModel(BiographicalCard) private cardModel: typeof BiographicalCard,
    @InjectModel(LifeEvent) private lifeEventModel: typeof LifeEvent,
    @InjectModel(TimelineEvent) private timelineModel: typeof TimelineEvent,
  ) {
    super(profileModel);
    this.cardBase = new BaseService<BiographicalCard>(cardModel);
    this.lifeEventBase = new BaseService<LifeEvent>(lifeEventModel);
    this.timelineBase = new BaseService<TimelineEvent>(timelineModel);
  }

  // ═══════════════════════════════════════════════════════════
  //  PROFILES
  // ═══════════════════════════════════════════════════════════

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.profileInclude,
      searchableFields: ['full_name', 'biography'],
      order: [['full_name', 'ASC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.profileInclude });
  }

  // ═══════════════════════════════════════════════════════════
  //  BIOGRAPHICAL CARDS
  // ═══════════════════════════════════════════════════════════

  async getCards(profileId: string) {
    await this.findOne(profileId);
    return this.cardModel.findAll({
      where: { person_profile_id: profileId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
      ],
    });
  }

  async createCard(profileId: string, data: Partial<BiographicalCard>) {
    await this.findOne(profileId);
    return this.cardModel.create({
      person_profile_id: profileId,
      ...data,
    } as any);
  }

  async updateCard(cardId: string, data: Partial<BiographicalCard>) {
    return this.cardBase.update(cardId, data);
  }

  async deleteCard(cardId: string) {
    return this.cardBase.remove(cardId);
  }

  // ═══════════════════════════════════════════════════════════
  //  LIFE EVENTS
  // ═══════════════════════════════════════════════════════════

  async getLifeEvents(profileId: string) {
    await this.findOne(profileId);
    return this.lifeEventModel.findAll({
      where: { person_profile_id: profileId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
        Location,
      ],
      order: [['event_date', 'ASC']],
    });
  }

  async createLifeEvent(profileId: string, data: Partial<LifeEvent>) {
    await this.findOne(profileId);
    return this.lifeEventModel.create({
      person_profile_id: profileId,
      ...data,
    } as any);
  }

  async updateLifeEvent(eventId: string, data: Partial<LifeEvent>) {
    return this.lifeEventBase.update(eventId, data);
  }

  async deleteLifeEvent(eventId: string) {
    return this.lifeEventBase.remove(eventId);
  }

  // ═══════════════════════════════════════════════════════════
  //  TIMELINE EVENTS
  // ═══════════════════════════════════════════════════════════

  async getTimelineEvents(profileId: string) {
    await this.findOne(profileId);
    return this.timelineModel.findAll({
      where: { related_person_id: profileId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
        { model: Contribution, attributes: ['id', 'title', 'status'] },
      ],
      order: [['event_date', 'ASC']],
    });
  }

  async createTimelineEvent(profileId: string, data: Partial<TimelineEvent>) {
    await this.findOne(profileId);
    return this.timelineModel.create({
      related_person_id: profileId,
      ...data,
    } as any);
  }

  async updateTimelineEvent(eventId: string, data: Partial<TimelineEvent>) {
    return this.timelineBase.update(eventId, data);
  }

  async deleteTimelineEvent(eventId: string) {
    return this.timelineBase.remove(eventId);
  }
}