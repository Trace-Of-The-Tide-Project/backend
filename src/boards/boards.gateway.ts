import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { BoardsService } from './boards.service';

interface BoardSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  namespace: '/boards',
  cors: { origin: '*', credentials: true },
})
export class BoardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Track online users per board: boardId -> Map<userId, { socketId, username }>
  private boardPresence = new Map<
    string,
    Map<string, { socketId: string; username: string }>
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly boardsService: BoardsService,
  ) {}

  // ─── Connection ─────────────────────────────────────────

  async handleConnection(client: BoardSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.id;
      client.username = payload.username || payload.full_name || 'User';
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: BoardSocket) {
    if (!client.userId) return;

    // Remove from all board presence maps
    for (const [boardId, users] of this.boardPresence.entries()) {
      if (users.has(client.userId)) {
        users.delete(client.userId);
        this.server.to(`board:${boardId}`).emit('user_left', {
          user_id: client.userId,
        });
        if (users.size === 0) this.boardPresence.delete(boardId);
      }
    }
  }

  // ─── Board Room ─────────────────────────────────────────

  @SubscribeMessage('join_board')
  async handleJoinBoard(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string },
  ) {
    if (!client.userId) return;

    const room = `board:${data.board_id}`;
    client.join(room);

    // Track presence
    if (!this.boardPresence.has(data.board_id)) {
      this.boardPresence.set(data.board_id, new Map());
    }
    this.boardPresence.get(data.board_id)!.set(client.userId, {
      socketId: client.id,
      username: client.username || 'User',
    });

    // Notify others
    client.to(room).emit('user_joined', {
      user_id: client.userId,
      username: client.username,
    });

    // Send current online users to the joiner
    const onlineUsers = Array.from(
      this.boardPresence.get(data.board_id)!.entries(),
    ).map(([userId, info]) => ({ user_id: userId, username: info.username }));
    client.emit('board_users', onlineUsers);
  }

  @SubscribeMessage('leave_board')
  handleLeaveBoard(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string },
  ) {
    if (!client.userId) return;

    const room = `board:${data.board_id}`;
    client.leave(room);

    const users = this.boardPresence.get(data.board_id);
    if (users) {
      users.delete(client.userId);
      if (users.size === 0) this.boardPresence.delete(data.board_id);
    }

    this.server.to(room).emit('user_left', { user_id: client.userId });
  }

  // ─── Elements ───────────────────────────────────────────

  @SubscribeMessage('element_create')
  async handleElementCreate(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody()
    data: { board_id: string; page_id: string; [key: string]: any },
  ) {
    if (!client.userId) return;

    const { board_id, page_id, ...elementData } = data;
    const element = await this.boardsService.createElement(
      page_id,
      elementData as any,
      client.userId,
    );

    this.server.to(`board:${board_id}`).emit('element_created', element);
  }

  @SubscribeMessage('element_update')
  async handleElementUpdate(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody()
    data: { board_id: string; element_id: string; [key: string]: any },
  ) {
    if (!client.userId) return;

    const { board_id, element_id, ...updateData } = data;
    const element = await this.boardsService.updateElement(
      element_id,
      updateData as any,
    );

    client.to(`board:${board_id}`).emit('element_updated', element);
  }

  @SubscribeMessage('element_move')
  async handleElementMove(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody()
    data: { board_id: string; element_id: string; x: number; y: number },
  ) {
    if (!client.userId) return;

    // Broadcast immediately for responsiveness
    client.to(`board:${data.board_id}`).emit('element_moved', {
      element_id: data.element_id,
      x: data.x,
      y: data.y,
      user_id: client.userId,
    });

    // Persist to DB
    await this.boardsService.updateElement(data.element_id, {
      x: data.x,
      y: data.y,
    });
  }

  @SubscribeMessage('element_delete')
  async handleElementDelete(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string; element_id: string },
  ) {
    if (!client.userId) return;

    await this.boardsService.removeElement(data.element_id);
    this.server.to(`board:${data.board_id}`).emit('element_deleted', {
      element_id: data.element_id,
    });
  }

  // ─── Connectors ─────────────────────────────────────────

  @SubscribeMessage('connector_create')
  async handleConnectorCreate(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string; [key: string]: any },
  ) {
    if (!client.userId) return;

    const { board_id, ...connectorData } = data;
    const connector = await this.boardsService.createConnector(
      connectorData as any,
      client.userId,
    );

    this.server.to(`board:${board_id}`).emit('connector_created', connector);
  }

  @SubscribeMessage('connector_update')
  async handleConnectorUpdate(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody()
    data: { board_id: string; connector_id: string; [key: string]: any },
  ) {
    if (!client.userId) return;

    const { board_id, connector_id, ...updateData } = data;
    const connector = await this.boardsService.updateConnector(
      connector_id,
      updateData as any,
    );

    client.to(`board:${board_id}`).emit('connector_updated', connector);
  }

  @SubscribeMessage('connector_delete')
  async handleConnectorDelete(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string; connector_id: string },
  ) {
    if (!client.userId) return;

    await this.boardsService.removeConnector(data.connector_id);
    this.server.to(`board:${data.board_id}`).emit('connector_deleted', {
      connector_id: data.connector_id,
    });
  }

  // ─── Cursor ─────────────────────────────────────────────

  @SubscribeMessage('cursor_move')
  handleCursorMove(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string; x: number; y: number },
  ) {
    if (!client.userId) return;

    client.to(`board:${data.board_id}`).emit('cursor_moved', {
      user_id: client.userId,
      username: client.username,
      x: data.x,
      y: data.y,
    });
  }

  // ─── Chat ───────────────────────────────────────────────

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string; content: string },
  ) {
    if (!client.userId) return;

    const message = await this.boardsService.sendChatMessage(
      data.board_id,
      client.userId,
      { content: data.content },
    );

    this.server.to(`board:${data.board_id}`).emit('chat_message', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: BoardSocket,
    @MessageBody() data: { board_id: string; is_typing: boolean },
  ) {
    if (!client.userId) return;

    client.to(`board:${data.board_id}`).emit('user_typing', {
      user_id: client.userId,
      username: client.username,
      is_typing: data.is_typing,
    });
  }

  // ─── Public helper for REST -> WS notifications ────────

  notifyBoardUpdate(boardId: string, data: any) {
    this.server.to(`board:${boardId}`).emit('board_updated', data);
  }
}
