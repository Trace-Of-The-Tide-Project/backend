import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BaseService } from '../common/base.service';
import { Board } from './models/board.model';
import { BoardMember } from './models/board-member.model';
import { BoardPage } from './models/board-page.model';
import { BoardElement } from './models/board-element.model';
import { BoardConnector } from './models/board-connector.model';
import { BoardChat } from './models/board-chat.model';
import { BoardComment } from './models/board-comment.model';
import { BoardTemplate } from './models/board-template.model';
import { User } from '../users/models/user.model';
import {
  CreateBoardDto,
  UpdateBoardDto,
  AddBoardMemberDto,
  UpdateBoardMemberDto,
  CreateBoardPageDto,
  UpdateBoardPageDto,
  CreateBoardElementDto,
  UpdateBoardElementDto,
  ReorderElementsDto,
  CreateBoardConnectorDto,
  UpdateBoardConnectorDto,
  CreateBoardChatDto,
  CreateBoardCommentDto,
  UpdateBoardCommentDto,
  CreateBoardTemplateDto,
} from './dto/board.dto';

@Injectable()
export class BoardsService extends BaseService<Board> {
  private readonly boardInclude = [
    { model: BoardPage, order: [['page_order', 'ASC']] },
    {
      model: BoardMember,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
    },
    { model: User, as: 'owner', attributes: ['id', 'username', 'full_name'] },
  ];

  constructor(
    @InjectModel(Board) private readonly boardModel: typeof Board,
    @InjectModel(BoardMember) private readonly memberModel: typeof BoardMember,
    @InjectModel(BoardPage) private readonly pageModel: typeof BoardPage,
    @InjectModel(BoardElement)
    private readonly elementModel: typeof BoardElement,
    @InjectModel(BoardConnector)
    private readonly connectorModel: typeof BoardConnector,
    @InjectModel(BoardChat) private readonly chatModel: typeof BoardChat,
    @InjectModel(BoardComment)
    private readonly commentModel: typeof BoardComment,
    @InjectModel(BoardTemplate)
    private readonly templateModel: typeof BoardTemplate,
  ) {
    super(boardModel);
  }

  // ─── Board CRUD ─────────────────────────────────────────

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.boardInclude,
      searchableFields: ['title', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.boardInclude });
  }

  async createBoard(dto: CreateBoardDto, userId: string) {
    const board = await this.boardModel.create({
      ...dto,
      owner_id: userId,
    } as any);

    // Auto-create Page 1
    await this.pageModel.create({
      board_id: board.id,
      title: 'Page 1',
      page_order: 1,
    } as any);

    // Add owner as member
    await this.memberModel.create({
      board_id: board.id,
      user_id: userId,
      role: 'owner',
    } as any);

    return this.findOne(board.id);
  }

  async updateBoard(id: string, dto: UpdateBoardDto, userId: string) {
    await this.verifyBoardAccess(id, userId, 'editor');
    return super.update(id, dto as any);
  }

  // ─── Access Control ─────────────────────────────────────

  async verifyBoardAccess(
    boardId: string,
    userId: string,
    requiredRole: string,
  ) {
    const member = await this.memberModel.findOne({
      where: { board_id: boardId, user_id: userId },
    });
    if (!member) {
      throw new ForbiddenException('You do not have access to this board');
    }

    const roleHierarchy = ['viewer', 'commenter', 'editor', 'owner'];
    const userLevel = roleHierarchy.indexOf(member.role);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`Requires ${requiredRole} role or higher`);
    }

    return member;
  }

  // ─── Members ────────────────────────────────────────────

  async getMembers(boardId: string) {
    return this.memberModel.findAll({
      where: { board_id: boardId },
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
      order: [['joined_at', 'ASC']],
    });
  }

  async addMember(boardId: string, dto: AddBoardMemberDto) {
    await this.findOne(boardId);

    const existing = await this.memberModel.findOne({
      where: { board_id: boardId, user_id: dto.user_id },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this board');
    }

    return this.memberModel.create({
      board_id: boardId,
      user_id: dto.user_id,
      role: dto.role || 'viewer',
    } as any);
  }

  async updateMember(
    boardId: string,
    memberId: string,
    dto: UpdateBoardMemberDto,
  ) {
    const [affected] = await this.memberModel.update(
      { role: dto.role },
      { where: { id: memberId, board_id: boardId } },
    );
    if (!affected) throw new NotFoundException('Member not found');
    return this.memberModel.findByPk(memberId);
  }

  async removeMember(boardId: string, memberId: string) {
    const member = await this.memberModel.findOne({
      where: { id: memberId, board_id: boardId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') {
      throw new ForbiddenException('Cannot remove the board owner');
    }
    await member.destroy();
    return { message: 'Member removed successfully' };
  }

  // ─── Pages ──────────────────────────────────────────────

  async getPages(boardId: string) {
    return this.pageModel.findAll({
      where: { board_id: boardId },
      order: [['page_order', 'ASC']],
    });
  }

  async addPage(boardId: string, dto: CreateBoardPageDto) {
    await this.findOne(boardId);

    const maxOrder =
      Number(
        (await this.pageModel.max('page_order', {
          where: { board_id: boardId },
        })) ?? 0,
      ) || 0;

    return this.pageModel.create({
      board_id: boardId,
      title: dto.title || `Page ${maxOrder + 1}`,
      page_order: maxOrder + 1,
    } as any);
  }

  async updatePage(boardId: string, pageId: string, dto: UpdateBoardPageDto) {
    const [affected] = await this.pageModel.update(dto as any, {
      where: { id: pageId, board_id: boardId },
    });
    if (!affected) throw new NotFoundException('Page not found');
    return this.pageModel.findByPk(pageId);
  }

  async removePage(boardId: string, pageId: string) {
    const page = await this.pageModel.findOne({
      where: { id: pageId, board_id: boardId },
    });
    if (!page) throw new NotFoundException('Page not found');

    // Cascade: delete connectors then elements
    await this.connectorModel.destroy({ where: { page_id: pageId } });
    await this.elementModel.destroy({ where: { page_id: pageId } });
    await page.destroy();
    return { message: 'Page deleted successfully' };
  }

  // ─── Elements ───────────────────────────────────────────

  async getPageElements(pageId: string) {
    return this.elementModel.findAll({
      where: { page_id: pageId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['z_index', 'ASC']],
    });
  }

  async createElement(
    pageId: string,
    dto: CreateBoardElementDto,
    userId: string,
  ) {
    return this.elementModel.create({
      page_id: pageId,
      created_by: userId,
      ...dto,
    } as any);
  }

  async updateElement(elementId: string, dto: UpdateBoardElementDto) {
    const [affected] = await this.elementModel.update(dto as any, {
      where: { id: elementId },
    });
    if (!affected) throw new NotFoundException('Element not found');
    return this.elementModel.findByPk(elementId);
  }

  async removeElement(elementId: string) {
    // Delete connectors linked to this element
    await this.connectorModel.destroy({
      where: {
        [require('sequelize').Op.or]: [
          { source_element_id: elementId },
          { target_element_id: elementId },
        ],
      },
    });
    const deleted = await this.elementModel.destroy({
      where: { id: elementId },
    });
    if (!deleted) throw new NotFoundException('Element not found');
    return { message: 'Element deleted successfully' };
  }

  async duplicateElement(elementId: string, userId: string) {
    const original = await this.elementModel.findByPk(elementId);
    if (!original) throw new NotFoundException('Element not found');

    return this.elementModel.create({
      page_id: original.page_id,
      created_by: userId,
      element_type: original.element_type,
      x: original.x + 20,
      y: original.y + 20,
      width: original.width,
      height: original.height,
      rotation: original.rotation,
      z_index: original.z_index + 1,
      content: original.content,
      properties: original.properties,
      is_locked: false,
    } as any);
  }

  async reorderElements(items: { id: string; z_index: number }[]) {
    for (const item of items) {
      await this.elementModel.update(
        { z_index: item.z_index },
        { where: { id: item.id } },
      );
    }
    return { message: 'Elements reordered successfully' };
  }

  // ─── Connectors ─────────────────────────────────────────

  async getPageConnectors(pageId: string) {
    return this.connectorModel.findAll({
      where: { page_id: pageId },
      include: [
        {
          model: BoardElement,
          as: 'source',
          attributes: ['id', 'element_type', 'x', 'y'],
        },
        {
          model: BoardElement,
          as: 'target',
          attributes: ['id', 'element_type', 'x', 'y'],
        },
      ],
    });
  }

  async createConnector(dto: CreateBoardConnectorDto, userId: string) {
    return this.connectorModel.create({
      ...dto,
      created_by: userId,
    } as any);
  }

  async updateConnector(connectorId: string, dto: UpdateBoardConnectorDto) {
    const [affected] = await this.connectorModel.update(dto as any, {
      where: { id: connectorId },
    });
    if (!affected) throw new NotFoundException('Connector not found');
    return this.connectorModel.findByPk(connectorId);
  }

  async removeConnector(connectorId: string) {
    const deleted = await this.connectorModel.destroy({
      where: { id: connectorId },
    });
    if (!deleted) throw new NotFoundException('Connector not found');
    return { message: 'Connector deleted successfully' };
  }

  // ─── Chat ───────────────────────────────────────────────

  async getChatMessages(boardId: string, query: any = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await this.chatModel.findAndCountAll({
      where: { board_id: boardId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'ASC']],
      limit,
      offset,
    });

    return {
      rows,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async sendChatMessage(
    boardId: string,
    userId: string,
    dto: CreateBoardChatDto,
  ) {
    const message = await this.chatModel.create({
      board_id: boardId,
      sender_id: userId,
      content: dto.content,
    } as any);

    return this.chatModel.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
    });
  }

  // ─── Comments ───────────────────────────────────────────

  async getElementComments(elementId: string) {
    return this.commentModel.findAll({
      where: { element_id: elementId, parent_comment_id: null as any },
      include: [
        { model: User, attributes: ['id', 'username', 'full_name'] },
        {
          model: BoardComment,
          as: 'replies',
          include: [
            { model: User, attributes: ['id', 'username', 'full_name'] },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async createComment(dto: CreateBoardCommentDto, userId: string) {
    const createData: any = {
      element_id: dto.element_id,
      user_id: userId,
      content: dto.content,
      parent_comment_id: dto.parent_comment_id || null,
      depth: 0,
    };

    if (dto.parent_comment_id) {
      const parent = await this.commentModel.findByPk(dto.parent_comment_id);
      if (parent) {
        createData.depth = (parent.depth || 0) + 1;
      }
    }

    return this.commentModel.create(createData);
  }

  async updateComment(commentId: string, dto: UpdateBoardCommentDto) {
    const [affected] = await this.commentModel.update(dto as any, {
      where: { id: commentId },
    });
    if (!affected) throw new NotFoundException('Comment not found');
    return this.commentModel.findByPk(commentId);
  }

  async removeComment(commentId: string) {
    const deleted = await this.commentModel.destroy({
      where: { id: commentId },
    });
    if (!deleted) throw new NotFoundException('Comment not found');
    return { message: 'Comment deleted successfully' };
  }

  // ─── Templates ──────────────────────────────────────────

  async getTemplates(query: any = {}) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const where: any = {};
    if (query.category) where.category = query.category;

    const { rows, count } = await this.templateModel.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    return {
      rows,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async getTemplate(id: string) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(dto: CreateBoardTemplateDto, userId: string) {
    return this.templateModel.create({
      ...dto,
      created_by: userId,
    } as any);
  }

  async createBoardFromTemplate(
    templateId: string,
    userId: string,
    title?: string,
  ) {
    const template = await this.getTemplate(templateId);
    const templateData = JSON.parse(template.template_data);

    const board = await this.boardModel.create({
      title: title || `${template.name} Board`,
      owner_id: userId,
      template_id: templateId,
      settings: templateData.settings
        ? JSON.stringify(templateData.settings)
        : null,
    } as any);

    // Add owner as member
    await this.memberModel.create({
      board_id: board.id,
      user_id: userId,
      role: 'owner',
    } as any);

    // Create pages with elements and connectors from template
    if (templateData.pages && Array.isArray(templateData.pages)) {
      for (let i = 0; i < templateData.pages.length; i++) {
        const pageData = templateData.pages[i];
        const page = await this.pageModel.create({
          board_id: board.id,
          title: pageData.title || `Page ${i + 1}`,
          page_order: i + 1,
        } as any);

        const elementIdMap: Record<string, string> = {};

        if (pageData.elements && Array.isArray(pageData.elements)) {
          for (const el of pageData.elements) {
            const oldId = el.id;
            const element = await this.elementModel.create({
              page_id: page.id,
              created_by: userId,
              element_type: el.element_type,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation || 0,
              z_index: el.z_index || 0,
              content: el.content || null,
              properties: el.properties || null,
            } as any);
            if (oldId) elementIdMap[oldId] = element.id;
          }
        }

        if (pageData.connectors && Array.isArray(pageData.connectors)) {
          for (const conn of pageData.connectors) {
            const sourceId = elementIdMap[conn.source_element_id];
            const targetId = elementIdMap[conn.target_element_id];
            if (sourceId && targetId) {
              await this.connectorModel.create({
                page_id: page.id,
                source_element_id: sourceId,
                target_element_id: targetId,
                connector_type: conn.connector_type || 'straight',
                start_arrow: conn.start_arrow || false,
                end_arrow: conn.end_arrow !== undefined ? conn.end_arrow : true,
                properties: conn.properties || null,
                created_by: userId,
              } as any);
            }
          }
        }
      }
    } else {
      // No pages in template, create default Page 1
      await this.pageModel.create({
        board_id: board.id,
        title: 'Page 1',
        page_order: 1,
      } as any);
    }

    return this.findOne(board.id);
  }
}
