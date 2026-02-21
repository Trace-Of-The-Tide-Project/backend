import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Notification } from './models/notification.model';
import { User } from '../users/models/user.model';

@Injectable()
export class NotificationsService extends BaseService<Notification> {
  private readonly defaultInclude = [
    { model: User, attributes: ['id', 'username', 'full_name'] },
  ];

  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {
    super(notificationModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['message', 'type'],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findByUser(userId: string, query: any = {}) {
    return super.findAll(
      { ...query, user_id: userId },
      {
        include: this.defaultInclude,
        searchableFields: ['message', 'type'],
        order: [['created_at', 'DESC']],
      },
    );
  }

  async markAsRead(id: string) {
    const [affected] = await this.notificationModel.update(
      { status: 'read' } as any,
      { where: { id } },
    );
    if (!affected) throw new NotFoundException(`Notification ${id} not found`);
    return this.findOne(id);
  }

  async markAllAsRead(userId: string) {
    const [affected] = await this.notificationModel.update(
      { status: 'read' } as any,
      { where: { user_id: userId, status: 'unread' } },
    );
    return { updated: affected };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.count({
      where: { user_id: userId, status: 'unread' },
    });
    return { unreadCount: count };
  }
}