import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { MagazineIssue } from './models/magazine-issue.model';
import { Magazine } from '../magazine/models/magazine.model';
import { User } from '../users/models/user.model';

@Injectable()
export class MagazineIssueService extends BaseService<MagazineIssue> {
  private readonly defaultInclude = [
    { model: Magazine, attributes: ['id', 'slug', 'name'] },
    { model: User, as: 'creator', attributes: ['id', 'full_name'] },
  ];

  constructor(
    @InjectModel(MagazineIssue)
    private readonly issueModel: typeof MagazineIssue,
  ) {
    super(issueModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'subtitle', 'slug'],
      order: [['edition_number', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findBySlug(slug: string) {
    const issue = await this.issueModel.findOne({
      where: { slug },
      include: this.defaultInclude,
    });
    if (!issue) throw new BadRequestException('Issue not found');
    return issue;
  }

  async create(data: Partial<MagazineIssue>) {
    const payload = data as any;

    if (payload.kind === 'crowdfunded') {
      if (!payload.funding_goal) {
        throw new BadRequestException('funding_goal is required for crowdfunded issues');
      }
      if (!payload.funding_deadline) {
        throw new BadRequestException('funding_deadline is required for crowdfunded issues');
      }
    }

    if (payload.kind === 'editorial') {
      payload.funding_goal = null;
      payload.funding_deadline = null;
    }

    return super.create(payload);
  }

  // Increment funding_raised and transition status to 'funded' when goal is reached
  async addPledgeAmount(issueId: string, amount: number) {
    const issue = await this.issueModel.findByPk(issueId);
    if (!issue) throw new BadRequestException('Issue not found');
    if (issue.kind !== 'crowdfunded') {
      throw new BadRequestException('This issue does not accept pledges');
    }

    const newRaised = Number(issue.funding_raised) + amount;
    const update: any = { funding_raised: newRaised };

    if (issue.funding_goal && newRaised >= Number(issue.funding_goal) && issue.status === 'funding') {
      update.status = 'funded';
    }

    await issue.update(update);
    return issue.reload({ include: this.defaultInclude });
  }
}
