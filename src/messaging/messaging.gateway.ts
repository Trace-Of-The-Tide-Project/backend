import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/sequelize';
import { Conversation } from './models/conversation.model';
import { Message } from './models/message.model';
import { User } from '../users/models/user.model';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Op } from 'sequelize';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  declare server: Server;

  private logger = new Logger('MessagingGateway');

  // Track online users: userId → Set<socketId>
  private onlineUsers = new Map<string, Set<string>>();

  // Track which conversation each socket is viewing
  private activeConversations = new Map<string, string>(); // socketId → conversationId

  constructor(
    @InjectModel(Conversation) private conversationModel: typeof Conversation,
    @InjectModel(Message) private messageModel: typeof Message,
    @InjectModel(User) private userModel: typeof User,
    private jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('Messaging WebSocket Gateway initialized');
  }

  // ─── CONNECTION / AUTH ────────────────────────────

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.id;

      // Get user info
      const user = await this.userModel.findByPk(client.userId, {
        attributes: ['id', 'username', 'full_name'],
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.username = user.full_name || user.username;

      // Track online status
      const userId = client.userId!;
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Join user's personal room (for direct notifications)
      client.join(`user:${userId}`);

      // Notify admins that user came online
      this.server.to('admins').emit('user_online', {
        user_id: userId,
        username: client.username,
        online: true,
      });

      this.logger.log(`Client connected: ${client.username} (${client.id})`);
    } catch (err: any) {
      this.logger.warn(`Client ${client.id} auth failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.onlineUsers.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(client.userId);
          // User fully offline — notify admins
          this.server.to('admins').emit('user_online', {
            user_id: client.userId,
            username: client.username,
            online: false,
          });
        }
      }
    }

    this.activeConversations.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── ROOM MANAGEMENT ─────────────────────────────

  @SubscribeMessage('join_admin')
  async handleJoinAdmin(@ConnectedSocket() client: AuthenticatedSocket) {
    // Verify user has admin role before allowing them to join admin room
    if (!client.userId) return { error: 'Unauthorized' };

    const { UserRole } = require('../users/models/user-role.model');
    const { Role } = require('../roles/models/role.model');
    const adminRoles = await UserRole.findAll({
      where: { user_id: client.userId },
      include: [{ model: Role, as: 'role', where: { name: ['admin', 'editor'] } }],
    });

    if (!adminRoles || adminRoles.length === 0) {
      this.logger.warn(`${client.username} tried to join admin room without permission`);
      return { error: 'Forbidden: admin role required' };
    }

    client.join('admins');
    this.logger.log(`${client.username} joined admin room`);
    return { event: 'joined', data: 'admins' };
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    const room = `conversation:${data.conversation_id}`;
    client.join(room);
    this.activeConversations.set(client.id, data.conversation_id);
    this.logger.log(`${client.username} joined ${room}`);
    return { event: 'joined', data: room };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    const room = `conversation:${data.conversation_id}`;
    client.leave(room);
    this.activeConversations.delete(client.id);
    return { event: 'left', data: room };
  }

  // ─── SEND MESSAGE ────────────────────────────────

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversation_id: string;
      content: string;
    },
  ) {
    if (!client.userId) return { error: 'Unauthorized' };

    try {
      const conversation = await this.conversationModel.findByPk(
        data.conversation_id,
      );
      if (!conversation) return { error: 'Conversation not found' };

      // Save message to DB
      const message = await this.messageModel.create({
        conversation_id: data.conversation_id,
        sender_id: client.userId,
        content: data.content,
        message_type: 'text',
      } as any);

      // Update conversation metadata
      const isAdmin = client.userId !== conversation.user_id;
      await conversation.update({
        last_message_at: new Date(),
        status: isAdmin ? 'pending' : 'open',
        unread_count: conversation.unread_count + 1,
      });

      const messagePayload = {
        id: message.id,
        conversation_id: data.conversation_id,
        sender_id: client.userId,
        sender_name: client.username,
        content: data.content,
        message_type: 'text',
        created_at: message.createdAt,
      };

      // Broadcast to everyone in the conversation room
      this.server
        .to(`conversation:${data.conversation_id}`)
        .emit('new_message', messagePayload);

      // Also notify the other party if they're not in the conversation room
      if (isAdmin) {
        // Admin sent → notify user
        this.server
          .to(`user:${conversation.user_id}`)
          .emit('notification', {
            type: 'new_message',
            conversation_id: data.conversation_id,
            sender_name: client.username,
            preview: data.content.substring(0, 100),
          });
      } else {
        // User sent → notify admins
        this.server.to('admins').emit('notification', {
          type: 'new_message',
          conversation_id: data.conversation_id,
          sender_name: client.username,
          preview: data.content.substring(0, 100),
        });
      }

      return { event: 'message_sent', data: messagePayload };
    } catch (err: any) {
      this.logger.error(`Send message error: ${err.message}`);
      return { error: 'Failed to send message' };
    }
  }

  // ─── TYPING INDICATOR ────────────────────────────

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string; is_typing: boolean },
  ) {
    // Broadcast to everyone in the conversation except sender
    client.to(`conversation:${data.conversation_id}`).emit('typing', {
      user_id: client.userId,
      username: client.username,
      is_typing: data.is_typing,
      conversation_id: data.conversation_id,
    });
  }

  // ─── READ RECEIPT ────────────────────────────────

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversation_id: string },
  ) {
    if (!client.userId) return;

    try {
      // Mark all messages from other party as read
      await this.messageModel.update(
        { is_read: true, read_at: new Date() },
        {
          where: {
            conversation_id: data.conversation_id,
            sender_id: { [Op.ne]: client.userId },
            is_read: false,
          },
        },
      );

      // Reset unread count
      await this.conversationModel.update(
        { unread_count: 0 },
        { where: { id: data.conversation_id } },
      );

      // Notify the sender that their messages were read
      client.to(`conversation:${data.conversation_id}`).emit('messages_read', {
        conversation_id: data.conversation_id,
        read_by: client.userId,
        read_at: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Mark read error: ${err.message}`);
    }
  }

  // ─── ONLINE STATUS ───────────────────────────────

  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers() {
    const onlineList = Array.from(this.onlineUsers.keys());
    return { event: 'online_users', data: onlineList };
  }

  // ─── UTILITY: Emit from service (for REST endpoints) ───

  // Call this from MessagingService when a message is sent via REST
  notifyNewMessage(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new_message', message);
  }

  // Call this when a broadcast is sent via REST
  notifyBroadcast(broadcast: any) {
    this.server.emit('broadcast', {
      id: broadcast.id,
      subject: broadcast.subject,
      message: broadcast.message,
      priority: broadcast.priority,
      sent_at: broadcast.sent_at,
    });
  }

  // Call this when conversation status changes via REST
  notifyConversationUpdate(conversationId: string, update: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('conversation_updated', {
        conversation_id: conversationId,
        ...update,
      });
  }
}