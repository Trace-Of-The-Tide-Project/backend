import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col } from 'sequelize';
import { Conversation } from './models/conversation.model';
import { Message } from './models/message.model';
import { Broadcast } from './models/broadcast.model';
import { MessageTemplate } from './models/message-template.model';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Conversation) private conversationModel: typeof Conversation,
    @InjectModel(Message) private messageModel: typeof Message,
    @InjectModel(Broadcast) private broadcastModel: typeof Broadcast,
    @InjectModel(MessageTemplate) private templateModel: typeof MessageTemplate,
    @InjectModel(User) private userModel: typeof User,
  ) {}

  // ─── SUMMARY CARDS ───────────────────────────────

  async getMessagingSummary() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [unread, highPriority, pending, resolvedThisWeek] = await Promise.all(
      [
        this.conversationModel.count({
          where: { status: 'open', unread_count: { [Op.gt]: 0 } },
        } as any),
        this.conversationModel.count({
          where: { priority: 'high', status: { [Op.in]: ['open', 'pending'] } },
        } as any),
        this.conversationModel.count({
          where: { status: 'pending' },
        } as any),
        this.conversationModel.count({
          where: {
            status: 'resolved',
            resolved_at: { [Op.gte]: weekAgo },
          },
        } as any),
      ],
    );

    return {
      unread_messages: unread as unknown as number,
      high_priority: highPriority as unknown as number,
      pending_response: pending as unknown as number,
      resolved_this_week: resolvedThisWeek as unknown as number,
    };
  }

  // ─── TAB 1: INBOX ────────────────────────────────

  async listConversations(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      where.subject = { [Op.iLike]: `%${query.search}%` };
    }

    const { rows, count } = await this.conversationModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [
        ['priority', 'DESC'],
        ['last_message_at', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      conversations: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  async getConversation(id: string) {
    const conversation = await this.conversationModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: Message,
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'full_name'],
            },
          ],
          separate: true,
          order: [['createdAt', 'ASC']],
        },
      ],
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  // User starts a conversation
  async createConversation(
    userId: string,
    data: {
      subject: string;
      message: string;
      category?: string;
      priority?: string;
    },
  ) {
    const conversation = await this.conversationModel.create({
      subject: data.subject,
      category: data.category || 'general',
      priority: data.priority || 'normal',
      status: 'open',
      user_id: userId,
      last_message_at: new Date(),
      unread_count: 1,
    } as any);

    await this.messageModel.create({
      conversation_id: conversation.id,
      sender_id: userId,
      content: data.message,
      message_type: 'text',
    } as any);

    return conversation;
  }

  // Reply to a conversation (user or admin)
  async replyToConversation(
    conversationId: string,
    senderId: string,
    data: {
      content: string;
      template_id?: string;
    },
  ) {
    const conversation = await this.conversationModel.findByPk(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    let content = data.content;
    let messageType = 'text';

    // If using a template, resolve it
    if (data.template_id) {
      const template = await this.templateModel.findByPk(data.template_id);
      if (template) {
        // Get the user to resolve template variables
        const user = await this.userModel.findByPk(conversation.user_id);
        content = this.resolveTemplate(template.body, user);
        messageType = 'template';
        await template.increment('usage_count');
      }
    }

    const message = await this.messageModel.create({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
    } as any);

    // Update conversation
    const isAdmin = senderId !== conversation.user_id;
    await conversation.update({
      last_message_at: new Date(),
      status: isAdmin ? 'pending' : 'open', // pending = waiting for user reply
      unread_count: conversation.unread_count + 1, // increment unread for the other party
    });

    return message;
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string) {
    await this.messageModel.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      },
    );

    await this.conversationModel.update(
      { unread_count: 0 },
      { where: { id: conversationId } },
    );

    return { success: true };
  }

  // Resolve conversation
  async resolveConversation(conversationId: string) {
    const conversation = await this.conversationModel.findByPk(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    await conversation.update({
      status: 'resolved',
      resolved_at: new Date(),
    });

    return conversation;
  }

  // Archive conversation
  async archiveConversation(conversationId: string) {
    const conversation = await this.conversationModel.findByPk(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    await conversation.update({ status: 'archived' });
    return conversation;
  }

  // Assign conversation to admin
  async assignConversation(conversationId: string, adminId: string) {
    const conversation = await this.conversationModel.findByPk(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    await conversation.update({ assigned_to: adminId });
    return conversation;
  }

  // List archived conversations
  async listArchived(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { rows, count } = await this.conversationModel.findAndCountAll({
      where: { status: 'archived' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      conversations: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  // User's own conversations
  async getMyConversations(
    userId: string,
    query: { page?: number; limit?: number },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { rows, count } = await this.conversationModel.findAndCountAll({
      where: { user_id: userId },
      order: [['last_message_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      conversations: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  // ─── TAB 2: BROADCAST ────────────────────────────

  async listBroadcasts(query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.status) where.status = query.status;

    const { rows, count } = await this.broadcastModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      broadcasts: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  async createBroadcast(
    adminId: string,
    data: {
      subject: string;
      message: string;
      target_audience?: string;
      priority?: string;
      template_id?: string;
      send?: boolean; // true = send immediately, false = save as draft
    },
  ) {
    // If template provided, get template content
    let message = data.message;
    if (data.template_id) {
      const template = await this.templateModel.findByPk(data.template_id);
      if (template) {
        message = template.body;
        await template.increment('usage_count');
      }
    }

    const broadcast = await this.broadcastModel.create({
      subject: data.subject,
      message,
      target_audience: data.target_audience || 'all_users',
      priority: data.priority || 'normal',
      template_id: data.template_id,
      status: data.send ? 'sent' : 'draft',
      created_by: adminId,
      sent_at: data.send ? new Date() : undefined,
    } as any);

    // If sending, count recipients
    if (data.send) {
      const recipientCount = await this.countRecipients(
        data.target_audience || 'all_users',
      );
      await broadcast.update({ recipients_count: recipientCount });
    }

    return broadcast;
  }

  async sendBroadcast(broadcastId: string) {
    const broadcast = await this.broadcastModel.findByPk(broadcastId);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    if (broadcast.status === 'sent') {
      throw new BadRequestException('Broadcast already sent');
    }

    const recipientCount = await this.countRecipients(
      broadcast.target_audience,
    );

    await broadcast.update({
      status: 'sent',
      sent_at: new Date(),
      recipients_count: recipientCount,
    });

    return broadcast;
  }

  async deleteBroadcast(broadcastId: string) {
    const broadcast = await this.broadcastModel.findByPk(broadcastId);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    if (broadcast.status === 'sent') {
      throw new BadRequestException('Cannot delete a sent broadcast');
    }

    await broadcast.destroy();
    return { success: true };
  }

  private async countRecipients(targetAudience: string): Promise<number> {
    if (targetAudience === 'all_users') {
      return this.userModel.count({
        where: { status: 'active' },
      } as any) as unknown as number;
    }

    // Map audience to role names
    const roleMap: Record<string, string> = {
      authors: 'author',
      editors: 'editor',
      admins: 'admin',
      contributors: 'user', // users who have contributed
    };

    const roleName = roleMap[targetAudience];
    if (!roleName) return 0;

    const count = await this.userModel.count({
      include: [
        {
          model: UserRole,
          required: true,
          include: [{ model: Role, where: { name: roleName }, required: true }],
        },
      ],
    } as any);

    return count as unknown as number;
  }

  // ─── TAB 3: TEMPLATES ────────────────────────────

  async listTemplates(query?: { category?: string }) {
    const where: any = {};
    if (query?.category) where.category = query.category;

    return this.templateModel.findAll({
      where,
      order: [['usage_count', 'DESC']],
    });
  }

  async getTemplate(id: string) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(
    adminId: string,
    data: {
      name: string;
      category?: string;
      subject?: string;
      body: string;
    },
  ) {
    return this.templateModel.create({
      name: data.name,
      category: data.category || 'general',
      subject: data.subject,
      body: data.body,
      created_by: adminId,
    } as any);
  }

  async updateTemplate(
    id: string,
    data: {
      name?: string;
      category?: string;
      subject?: string;
      body?: string;
    },
  ) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('Template not found');

    await template.update(data);
    return template;
  }

  async deleteTemplate(id: string) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('Template not found');

    await template.destroy();
    return { success: true };
  }

  // ─── TEMPLATE RESOLUTION ─────────────────────────

  private resolveTemplate(body: string, user: User | null): string {
    if (!user) return body;

    const now = new Date();
    const variables: Record<string, string> = {
      '{{name}}': user.full_name || user.username || 'User',
      '{{email}}': user.email || '',
      '{{role}}': 'member',
      '{{date}}': now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    let resolved = body;
    for (const [key, value] of Object.entries(variables)) {
      resolved = resolved.replace(
        new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'),
        value,
      );
    }

    return resolved;
  }
}
