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
  ];

  constructor(
    @InjectModel(OpenCall) private readonly openCallModel: typeof OpenCall,
    @InjectModel(Participant)
    private readonly participantModel: typeof Participant,
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

  /**
   * Public listing — only open/active calls, no auth needed.
   * Used on the public "Open Calls" page for visitors.
   */
  async findActiveOpenCalls(query: any = {}) {
    const now = new Date();
    return super.findAll(
      { ...query, status: 'open' },
      {
        include: this.openCallInclude,
        searchableFields: ['title', 'description', 'category'],
        order: [['timeline_end', 'ASC']], // soonest deadline first
      },
    );
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.openCallInclude });
  }

  /**
   * Create open call with sensible defaults.
   * Only admins/editors can create calls.
   */
  async createOpenCall(data: Partial<OpenCall>) {
    if (!data.title) {
      throw new BadRequestException('Title is required');
    }

    return this.openCallModel.create({
      status: 'open',
      ...data,
    } as any);
  }

  /**
   * Update open call. Cannot update closed calls unless reopening.
   */
  async updateOpenCall(id: string, data: Partial<OpenCall>) {
    return super.update(id, data);
  }

  /**
   * Close an open call — sets status to 'closed'.
   * Prevents new participants from joining.
   */
  async closeOpenCall(id: string) {
    const openCall = await this.openCallModel.findByPk(id);
    if (!openCall) throw new NotFoundException(`Open call ${id} not found`);
    if (openCall.status === 'closed') {
      throw new BadRequestException('Open call is already closed');
    }

    await openCall.update({ status: 'closed' });
    return openCall;
  }

  /**
   * Reopen a closed call.
   */
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

  /**
   * Join an open call.
   * Figma shows: first name, last name, email, phone, experience field,
   * about, country, city, file uploads, terms agreement.
   * Core participant data goes in participants table,
   * any linked contribution goes via contribution_id.
   */
  async joinOpenCall(openCallId: string, data: Partial<Participant>) {
    // Validate open call exists and is open
    const openCall = await this.openCallModel.findByPk(openCallId);
    if (!openCall) throw new NotFoundException(`Open call ${openCallId} not found`);
    if (openCall.status !== 'open') {
      throw new BadRequestException('This open call is no longer accepting participants');
    }

    // Check deadline
    if (openCall.timeline_end && new Date() > new Date(openCall.timeline_end)) {
      throw new BadRequestException('The deadline for this open call has passed');
    }

    // Check user isn't already a participant
    if (data.user_id) {
      const existing = await this.participantModel.findOne({
        where: { open_call_id: openCallId, user_id: data.user_id },
      });
      if (existing) {
        throw new ConflictException('You have already joined this open call');
      }
    }

    return this.participantModel.create({
      open_call_id: openCallId,
      role: 'participant',
      status: 'active',
      join_date: new Date(),
      ...data,
    } as any);
  }

  /**
   * Leave / withdraw from an open call.
   */
  async leaveOpenCall(openCallId: string, userId: string) {
    const openCall = await this.openCallModel.findByPk(openCallId);
    if (!openCall) throw new NotFoundException(`Open call ${openCallId} not found`);

    const deleted = await this.participantModel.destroy({
      where: { open_call_id: openCallId, user_id: userId },
    });
    if (!deleted) {
      throw new NotFoundException('You are not a participant of this open call');
    }

    return { message: 'Successfully withdrawn from open call' };
  }

  /**
   * Get participants for a specific open call (admin view).
   */
  async getParticipants(openCallId: string, query: any = {}) {
    await this.findOne(openCallId); // validate exists

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

  /**
   * Update participant status (approve, reject, promote role).
   * Used by admin to manage applicants.
   */
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

  /**
   * Remove a participant (admin action).
   */
  async removeParticipant(openCallId: string, participantId: string) {
    const deleted = await this.participantModel.destroy({
      where: { id: participantId, open_call_id: openCallId },
    });
    if (!deleted) {
      throw new NotFoundException('Participant not found in this open call');
    }

    return { message: 'Participant removed successfully' };
  }

  /**
   * Link a contribution to a participant's entry.
   * This connects the content they submitted to their participation.
   */
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

    // Validate contribution exists
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