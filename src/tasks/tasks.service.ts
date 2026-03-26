import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { Task } from './models/task.model';
import { User } from '../users/models/user.model';
import { Article } from '../articles/models/article.model';
import { Contribution } from '../contributions/models/contribution.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Notification } from '../notifications/models/notification.model';

@Injectable()
export class TasksService extends BaseService<Task> {
  private readonly defaultInclude = [
    {
      model: User,
      as: 'assignee',
      attributes: ['id', 'username', 'full_name'],
    },
    {
      model: User,
      as: 'assigner',
      attributes: ['id', 'username', 'full_name'],
    },
    { model: Article, attributes: ['id', 'title', 'slug'], required: false },
    {
      model: Contribution,
      attributes: ['id', 'title', 'status'],
      required: false,
    },
    {
      model: OpenCall,
      attributes: ['id', 'title', 'status'],
      required: false,
    },
  ];

  constructor(
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {
    super(taskModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'status', 'priority'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findByAssignee(userId: string, query: any = {}) {
    return super.findAll(
      { ...query, assignee_id: userId },
      {
        include: this.defaultInclude,
        searchableFields: ['title', 'status'],
        order: [['createdAt', 'DESC']],
      },
    );
  }

  async findByAssigner(userId: string, query: any = {}) {
    return super.findAll(
      { ...query, assigner_id: userId },
      {
        include: this.defaultInclude,
        searchableFields: ['title', 'status'],
        order: [['createdAt', 'DESC']],
      },
    );
  }

  async createTask(data: any, assignerId: string) {
    const task = await this.taskModel.create({
      ...data,
      assigner_id: assignerId,
    });

    // Notify the assignee
    await this.notificationModel.create({
      user_id: data.assignee_id,
      type: 'task_assigned',
      message: `You have been assigned a new task: ${data.title}`,
      status: 'unread',
    } as any);

    return this.findOne(task.id);
  }

  async updateTaskStatus(id: string, status: string) {
    const task = await this.taskModel.findByPk(id);
    if (!task) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException(`Task ${id} not found`);
    }

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    await task.update(updateData);

    // Notify assigner of status change
    await this.notificationModel.create({
      user_id: task.assigner_id,
      type: 'task_status_changed',
      message: `Task "${task.title}" status changed to ${status}`,
      status: 'unread',
    } as any);

    return this.findOne(id);
  }
}
