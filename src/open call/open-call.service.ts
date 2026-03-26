import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BaseService } from '../common/base.service';
import { OpenCall } from './models/open-call.model';
import { Participant } from './models/participant.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';
import { File } from '../files/models/file.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { EmailService } from '../email/email.service';
import { JoinOpenCallDto } from './dto/join-open-call.dto';

@Injectable()
export class OpenCallsService extends BaseService<OpenCall> {
  private readonly openCallInclude = [
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'username', 'full_name', 'email'],
    },
    {
      model: Participant,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name'] },
        { model: Contribution, attributes: ['id', 'title', 'status'] },
      ],
    },
  ];

  private readonly participantInclude = [
    { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
    { model: OpenCall, attributes: ['id', 'title', 'status', 'category'] },
    { model: Contribution, attributes: ['id', 'title', 'status'] },
    {
      model: File,
      attributes: ['id', 'file_name', 'mime_type', 'file_size', 'path'],
    },
  ];

  constructor(
    @InjectModel(OpenCall) private readonly openCallModel: typeof OpenCall,
    @InjectModel(Participant)
    private readonly participantModel: typeof Participant,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    private readonly emailService: EmailService,
  ) {
    super(openCallModel);
  }

  // ═══════════════════════════════════════════════════════════
  //  OPEN CALLS — CRUD + Business Logic
  // ═══════════════════════════════════════════════════════════

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.openCallInclude,
      searchableFields: ['title', 'description', 'category'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findActiveOpenCalls(query: any = {}) {
    const now = new Date();
    return super.findAll(
      { ...query, status: 'open', timeline_end: { [Op.gte]: now } },
      {
        include: this.openCallInclude,
        searchableFields: ['title', 'description', 'category'],
        order: [['timeline_end', 'ASC']],
      },
    );
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.openCallInclude });
  }

  async createOpenCall(data: Partial<OpenCall>) {
    if (!data.title) {
      throw new BadRequestException('Title is required');
    }

    return this.openCallModel.create({
      status: 'open',
      ...data,
    } as any);
  }

  async updateOpenCall(id: string, data: Partial<OpenCall>) {
    return super.update(id, data);
  }

  async closeOpenCall(id: string) {
    const openCall = await this.openCallModel.findByPk(id);
    if (!openCall) throw new NotFoundException(`Open call ${id} not found`);
    if (openCall.status === 'closed') {
      throw new BadRequestException('Open call is already closed');
    }

    await openCall.update({ status: 'closed' });
    return openCall;
  }

  async reopenOpenCall(id: string) {
    const openCall = await this.openCallModel.findByPk(id);
    if (!openCall) throw new NotFoundException(`Open call ${id} not found`);
    if (openCall.status === 'open') {
      throw new BadRequestException('Open call is already open');
    }

    await openCall.update({ status: 'open' });
    return openCall;
  }

  async deleteOpenCall(id: string) {
    return super.remove(id);
  }

  // ═══════════════════════════════════════════════════════════
  //  PARTICIPANTS — Join / Leave / Manage
  // ═══════════════════════════════════════════════════════════

  async joinOpenCall(
    openCallId: string,
    dto: JoinOpenCallDto,
    files: Express.Multer.File[] = [],
  ) {
    // Validate open call exists and is open
    const openCall = await this.openCallModel.findByPk(openCallId);
    if (!openCall)
      throw new NotFoundException(`Open call ${openCallId} not found`);
    if (openCall.status !== 'open') {
      throw new BadRequestException(
        'This open call is no longer accepting participants',
      );
    }

    // Check deadline
    if (openCall.timeline_end && new Date() > new Date(openCall.timeline_end)) {
      throw new BadRequestException(
        'The deadline for this open call has passed',
      );
    }

    // Check user isn't already a participant (by user_id or email)
    if (dto.user_id) {
      const existing = await this.participantModel.findOne({
        where: { open_call_id: openCallId, user_id: dto.user_id },
      });
      if (existing) {
        throw new ConflictException('You have already joined this open call');
      }
    }

    const existingByEmail = await this.participantModel.findOne({
      where: { open_call_id: openCallId, email: dto.email },
    });
    if (existingByEmail) {
      throw new ConflictException(
        'This email has already been used to join this open call',
      );
    }

    const participant = await this.participantModel.create({
      open_call_id: openCallId,
      user_id: dto.user_id || null,
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone_number: dto.phone_number,
      experience_field: dto.experience_field,
      about: dto.about,
      country: dto.country,
      city: dto.city,
      terms_agreed: dto.terms_agreed,
      role: 'participant',
      status: 'active',
      join_date: new Date(),
    } as any);

    // Store uploaded files linked to the participant
    if (files.length > 0) {
      for (const file of files) {
        await File.create({
          contribution_id: null,
          participant_id: participant.id,
          file_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          path: file.path.replace(/\\/g, '/'),
          uploaded_by: dto.user_id || null,
          upload_date: new Date(),
        } as any);
      }
    }

    // Send confirmation email
    await this.emailService.sendOpenCallConfirmationEmail(
      dto.email,
      dto.first_name,
      openCall.title,
    );

    return participant;
  }

  async leaveOpenCall(openCallId: string, userId: string) {
    const openCall = await this.openCallModel.findByPk(openCallId);
    if (!openCall)
      throw new NotFoundException(`Open call ${openCallId} not found`);

    const deleted = await this.participantModel.destroy({
      where: { open_call_id: openCallId, user_id: userId },
    });
    if (!deleted) {
      throw new NotFoundException(
        'You are not a participant of this open call',
      );
    }

    return { message: 'Successfully withdrawn from open call' };
  }

  async getParticipants(openCallId: string, query: any = {}) {
    await this.findOne(openCallId);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    const where: any = { open_call_id: openCallId };
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;

    const { rows, count } = await this.participantModel.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
        { model: Contribution, attributes: ['id', 'title', 'status'] },
        {
          model: File,
          attributes: ['id', 'file_name', 'mime_type', 'file_size', 'path'],
        },
      ],
      limit,
      offset,
      order: [['join_date', 'DESC']],
      distinct: true,
    });

    return {
      rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async updateParticipant(
    openCallId: string,
    participantId: string,
    data: { status?: string; role?: string; contribution_id?: string },
  ) {
    const participant = await this.participantModel.findOne({
      where: { id: participantId, open_call_id: openCallId },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found in this open call');
    }

    await participant.update(data);
    return this.participantModel.findByPk(participantId, {
      include: this.participantInclude,
    });
  }

  async removeParticipant(openCallId: string, participantId: string) {
    const deleted = await this.participantModel.destroy({
      where: { id: participantId, open_call_id: openCallId },
    });
    if (!deleted) {
      throw new NotFoundException('Participant not found in this open call');
    }

    return { message: 'Participant removed successfully' };
  }

  async linkContribution(
    openCallId: string,
    participantId: string,
    contributionId: string,
  ) {
    const participant = await this.participantModel.findOne({
      where: { id: participantId, open_call_id: openCallId },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found in this open call');
    }

    const contribution = await Contribution.findByPk(contributionId);
    if (!contribution) {
      throw new NotFoundException(`Contribution ${contributionId} not found`);
    }

    await participant.update({ contribution_id: contributionId });
    return this.participantModel.findByPk(participantId, {
      include: this.participantInclude,
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  EDITOR APPLICATION via Open Call
  // ═══════════════════════════════════════════════════════════

  async applyForEditor(openCallId: string, userId: string) {
    const openCall = await this.openCallModel.findByPk(openCallId);
    if (!openCall)
      throw new NotFoundException(`Open call ${openCallId} not found`);
    if (openCall.status !== 'open') {
      throw new BadRequestException('This open call is no longer accepting applications');
    }

    const editorRole = await this.roleModel.findOne({
      where: { name: 'editor' },
    });
    if (!editorRole) throw new NotFoundException('Editor role not found');

    // Check for existing pending application
    const existing = await this.userRoleModel.findOne({
      where: {
        user_id: userId,
        role_id: editorRole.id,
        assigned_at: { [Op.is]: null as any },
      },
    });
    if (existing) {
      throw new ConflictException('You already have a pending editor application');
    }

    // Check if user already has the editor role
    const hasRole = await this.userRoleModel.findOne({
      where: {
        user_id: userId,
        role_id: editorRole.id,
        assigned_at: { [Op.not]: null as any },
      },
    });
    if (hasRole) {
      throw new ConflictException('You already have the editor role');
    }

    return this.userRoleModel.create({
      user_id: userId,
      role_id: editorRole.id,
      assigned_at: null,
      open_call_id: openCallId,
    } as any);
  }

  // ═══════════════════════════════════════════════════════════
  //  STATISTICS (for dashboard)
  // ═══════════════════════════════════════════════════════════

  async getStats() {
    const totalOpenCalls = await this.openCallModel.count();
    const activeOpenCalls = await this.openCallModel.count({
      where: { status: 'open' },
    });
    const closedOpenCalls = await this.openCallModel.count({
      where: { status: 'closed' },
    });
    const totalParticipants = await this.participantModel.count();

    return {
      totalOpenCalls,
      activeOpenCalls,
      closedOpenCalls,
      totalParticipants,
    };
  }
}
