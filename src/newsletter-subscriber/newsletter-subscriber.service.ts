import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BaseService } from '../common/base.service';
import { NewsletterSubscriber } from './models/newsletter-subscriber.model';
import { Magazine } from '../magazine/models/magazine.model';

@Injectable()
export class NewsletterSubscriberService extends BaseService<NewsletterSubscriber> {
  constructor(
    @InjectModel(NewsletterSubscriber)
    private readonly subscriberModel: typeof NewsletterSubscriber,
  ) {
    super(subscriberModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      searchableFields: ['email'],
      order: [['createdAt', 'DESC']],
    });
  }

  async subscribe(data: { magazine_id: string; email: string; user_id?: string; source?: string }) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await this.subscriberModel.findOne({
      where: {
        magazine_id: data.magazine_id,
        email: { [Op.iLike]: normalizedEmail },
      },
    });

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Re-subscribe
        await existing.update({ status: 'pending', unsubscribed_at: null, consent_given_at: new Date() });
        return existing;
      }
      throw new BadRequestException('This email is already subscribed to this magazine');
    }

    return this.subscriberModel.create({
      ...data,
      email: normalizedEmail,
      status: 'pending',
      consent_given_at: new Date(),
    } as any);
  }

  async confirm(id: string) {
    const subscriber = await this.subscriberModel.findByPk(id);
    if (!subscriber) throw new BadRequestException('Subscriber not found');
    if (subscriber.status === 'confirmed') return subscriber;

    await subscriber.update({ status: 'confirmed', confirmed_at: new Date() });
    return subscriber;
  }

  async unsubscribe(id: string) {
    const subscriber = await this.subscriberModel.findByPk(id);
    if (!subscriber) throw new BadRequestException('Subscriber not found');

    await subscriber.update({ status: 'unsubscribed', unsubscribed_at: new Date() });
    return subscriber;
  }
}
