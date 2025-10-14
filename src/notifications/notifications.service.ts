import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './models/notification.model';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {}

  async create(data: Partial<Notification>) {
    return this.notificationModel.create(data as any);
  }

  async findAll() {
    return this.notificationModel.findAll();
  }

  async findByUser(userId: string) {
    return this.notificationModel.findAll({ where: { user_id: userId } });
  }

  async markAsRead(id: string) {
    const [affected] = await this.notificationModel.update(
      { status: 'read' },
      { where: { id } },
    );
    if (!affected) throw new NotFoundException(`Notification ${id} not found`);
    return this.notificationModel.findByPk(id);
  }

  async remove(id: string) {
    const deleted = await this.notificationModel.destroy({ where: { id } });
    if (!deleted) throw new NotFoundException(`Notification ${id} not found`);
    return { message: `Notification ${id} deleted successfully` };
  }
}
