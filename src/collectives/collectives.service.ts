import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BaseService } from '../common/base.service';
import { Collective } from './models/collective.model';
import { CollectiveMember } from './models/collective-member.model';
import { User } from '../users/models/user.model';
import { JoinCollectiveDto } from './dto/join-collective.dto';

@Injectable()
export class CollectivesService extends BaseService<Collective> {
  private readonly defaultInclude = [
    {
      model: CollectiveMember,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
    },
    { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
  ];

  constructor(
    @InjectModel(Collective)
    private readonly collectiveModel: typeof Collective,

    @InjectModel(CollectiveMember)
    private readonly memberModel: typeof CollectiveMember,
  ) {
    super(collectiveModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['name', 'description'],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async joinCollective(collectiveId: string, dto: JoinCollectiveDto) {
    const collective = await this.collectiveModel.findByPk(collectiveId);
    if (!collective) {
      throw new NotFoundException(`Collective ${collectiveId} not found`);
    }

    // Check for duplicate join by user_id or email
    const whereConditions: any[] = [
      { collective_id: collectiveId, email: dto.email },
    ];
    if (dto.user_id) {
      whereConditions.push({
        collective_id: collectiveId,
        user_id: dto.user_id,
      });
    }

    const existing = await this.memberModel.findOne({
      where: { [Op.or]: whereConditions },
    });
    if (existing) {
      throw new ConflictException(
        'You have already submitted a request to join this collective',
      );
    }

    return this.memberModel.create({
      collective_id: collectiveId,
      user_id: dto.user_id || null,
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      phone_number: dto.phone_number,
      experience_field: dto.experience_field,
      traces: dto.traces || null,
      about: dto.about,
      facebook: dto.facebook || null,
      twitter: dto.twitter || null,
      instagram: dto.instagram || null,
      linkedin: dto.linkedin || null,
      custom_links: dto.custom_links || null,
      terms_agreed: dto.terms_agreed,
      availability_type: dto.availability_type || null,
      availability_days: dto.availability_days || null,
      availability_slots: dto.availability_slots || null,
      availability_date: dto.availability_date || null,
      availability_timezone: dto.availability_timezone || null,
      role: 'member',
      status: 'pending',
      joined_at: new Date(),
    } as any);
  }

  async addMember(collectiveId: string, userId: string, role = 'member') {
    // Validate collective exists
    await this.findOne(collectiveId);

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Check for duplicate membership
    const existing = await this.memberModel.findOne({
      where: { collective_id: collectiveId, user_id: userId },
    });
    if (existing) {
      throw new ConflictException(
        'User is already a member of this collective',
      );
    }

    return this.memberModel.create({
      collective_id: collectiveId,
      user_id: userId,
      role,
      joined_at: new Date(),
    } as any);
  }

  async removeMember(collectiveId: string, userId: string) {
    // Validate collective exists
    await this.findOne(collectiveId);

    const deleted = await this.memberModel.destroy({
      where: { collective_id: collectiveId, user_id: userId },
    });
    if (!deleted) {
      throw new NotFoundException('Member not found in this collective');
    }

    return { message: 'Member removed successfully' };
  }

  async getMembers(collectiveId: string) {
    await this.findOne(collectiveId);

    return this.memberModel.findAll({
      where: { collective_id: collectiveId },
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
      order: [['joined_at', 'ASC']],
    });
  }
}
