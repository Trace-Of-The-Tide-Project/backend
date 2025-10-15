import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './models/notification.model';
import { BaseService } from '../common/base.service';

@Injectable()
export class NotificationsService extends BaseService<Notification> {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {
    super(notificationModel);
  }

  async findByUser(userId: string) {
    return this.model.findAll({ where: { user_id: userId } });
  }

  async markAsRead(id: string) {
    const [affected] = await this.model.update(
      { status: 'read' },
      { where: { id } },
    );

    if (!affected) throw new NotFoundException(`Notification ${id} not found`);
    return this.model.findByPk(id);
  }
}
