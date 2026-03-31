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
import { ApplyOpenCallDto } from './dto/apply-open-call.dto';

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

  async createOpenCall(data: any) {
    if (!data.title) {
      throw new BadRequestException('Title is required');
    }

    // Map action to status
    let status = 'draft';
    if (data.action === 'publish') {
      status = 'open';
      (data as any).published_at = new Date();
    } else if (data.action === 'schedule') {
      if (!data.scheduled_at) {
        throw new BadRequestException('scheduled_at is required when action is "schedule"');
      }
      status = 'scheduled';
    } else if (data.action === 'draft') {
      status = 'draft';
    }

    // Extract settings if provided as nested object
    if (data.settings) {
      if (data.settings.category) data.category = data.settings.category;
      if (data.settings.tags) data.tags = data.settings.tags;
      if (data.settings.language) data.language = data.settings.language;
      if (data.settings.visibility) data.visibility = data.settings.visibility;
      delete data.settings;
    }

    delete data.action;

    return this.openCallModel.create({
      status,
      ...data,
    } as any);
  }

  async updateOpenCall(id: string, data: any) {
    // Handle action on update
    if (data.action === 'publish') {
      data.status = 'open';
      data.published_at = new Date();
    } else if (data.action === 'schedule') {
      if (!data.scheduled_at) {
        throw new BadRequestException('scheduled_at is required when action is "schedule"');
      }
      data.status = 'scheduled';
    } else if (data.action === 'draft') {
      data.status = 'draft';
    }

    if (data.settings) {
      if (data.settings.category) data.category = data.settings.category;
      if (data.settings.tags) data.tags = data.settings.tags;
      if (data.settings.language) data.language = data.settings.language;
      if (data.settings.visibility) data.visibility = data.settings.visibility;
      delete data.settings;
    }

    delete data.action;
    return super.update(id, data);
  }

  async publishOpenCall(id: string) {
    const openCall = await this.openCallModel.findByPk(id);
    if (!openCall) throw new NotFoundException(`Open call ${id} not found`);
    await openCall.update({ status: 'open', published_at: new Date() });
    return openCall;
  }

  async scheduleOpenCall(id: string, scheduledAt: string) {
    if (!scheduledAt) {
      throw new BadRequestException('scheduled_at is required');
    }
    const openCall = await this.openCallModel.findByPk(id);
    if (!openCall) throw new NotFoundException(`Open call ${id} not found`);
    await openCall.update({ status: 'scheduled', scheduled_at: new Date(scheduledAt) });
    return openCall;
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

  async applyToOpenCall(
    openCallId: string,
    dto: ApplyOpenCallDto,
    files: Express.Multer.File[] = [],
  ) {
    const openCall = await this.openCallModel.findByPk(openCallId);
    if (!openCall)
      throw new NotFoundException(`Open call ${openCallId} not found`);
    if (openCall.status !== 'open') {
      throw new BadRequestException('This open call is no longer accepting applications');
    }

    if (openCall.timeline_end && new Date() > new Date(openCall.timeline_end)) {
      throw new BadRequestException('The deadline for this open call has passed');
    }

    // Validate answers against application_form if defined
    if (openCall.application_form?.fields) {
      for (const field of openCall.application_form.fields) {
        if (field.required && field.type !== 'checkbox' && field.type !== 'file_multiple') {
          if (!dto.answers[field.name] && dto.answers[field.name] !== false) {
            throw new BadRequestException(`Field "${field.name}" is required`);
          }
        }
        if (field.type === 'email' && dto.answers[field.name]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(dto.answers[field.name])) {
            throw new BadRequestException(`Field "${field.name}" must be a valid email`);
          }
        }
      }
    }

    // Check duplicate by email (from answers)
    const email = dto.answers.email || dto.answers.Email;
    if (email) {
      const existingByEmail = await this.participantModel.findOne({
        where: { open_call_id: openCallId, email },
      });
      if (existingByEmail) {
        throw new ConflictException('This email has already been used to apply');
      }
    }

    if (dto.user_id) {
      const existing = await this.participantModel.findOne({
        where: { open_call_id: openCallId, user_id: dto.user_id },
      });
      if (existing) {
        throw new ConflictException('You have already applied to this open call');
      }
    }

    // Map known answer fields to legacy columns for backward compatibility
    const participant = await this.participantModel.create({
      open_call_id: openCallId,
      user_id: dto.user_id || null,
      first_name: dto.answers.first_name || null,
      last_name: dto.answers.last_name || null,
      email: email || null,
      phone_number: dto.answers.phone || dto.answers.phone_number || null,
      experience_field: dto.answers.experience_field || null,
      about: dto.answers.about || null,
      country: dto.answers.country || null,
      city: dto.answers.city || null,
      terms_agreed: dto.terms_agreement,
      form_answers: dto.answers,
      role: 'participant',
      status: 'active',
      join_date: new Date(),
    } as any);

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

    if (email) {
      await this.emailService.sendOpenCallConfirmationEmail(
        email,
        dto.answers.first_name || 'Applicant',
        openCall.title,
      );
    }

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
