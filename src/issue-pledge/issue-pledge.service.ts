import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { IssuePledge } from './models/issue-pledge.model';
import { MagazineIssue } from '../magazine-issue/models/magazine-issue.model';
import { MagazineIssueService } from '../magazine-issue/magazine-issue.service';
import { User } from '../users/models/user.model';

@Injectable()
export class IssuePledgeService extends BaseService<IssuePledge> {
  private readonly defaultInclude = [
    { model: MagazineIssue, attributes: ['id', 'title', 'slug', 'kind', 'status'] },
    { model: User, as: 'backer', attributes: ['id', 'full_name', 'email'] },
  ];

  constructor(
    @InjectModel(IssuePledge)
    private readonly pledgeModel: typeof IssuePledge,
    private readonly issueService: MagazineIssueService,
  ) {
    super(pledgeModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async create(data: Partial<IssuePledge>) {
    const payload = data as any;

    if (!payload.amount || payload.amount <= 0) {
      throw new BadRequestException('Pledge amount must be greater than 0');
    }

    // Verify the issue exists and accepts pledges
    const issue = await this.pledgeModel.sequelize!.models['MagazineIssue'].findByPk(payload.issue_id);
    if (!issue) throw new BadRequestException('Issue not found');
    if ((issue as any).kind !== 'crowdfunded') {
      throw new BadRequestException('This issue does not accept pledges');
    }
    if (!['proposed', 'funding'].includes((issue as any).status)) {
      throw new BadRequestException('This issue is not currently accepting pledges');
    }

    const pledge = await super.create(payload);

    // If status is 'captured' from the start (e.g. synchronous payment), update totals
    if (payload.status === 'captured') {
      await this.issueService.addPledgeAmount(payload.issue_id, payload.amount);
    }

    return pledge;
  }

  // Called by payment webhook to mark a pledge as captured
  async capture(pledgeId: string) {
    const pledge = await this.pledgeModel.findByPk(pledgeId);
    if (!pledge) throw new BadRequestException('Pledge not found');
    if (pledge.status === 'captured') throw new BadRequestException('Pledge already captured');

    await pledge.update({ status: 'captured', captured_at: new Date() });
    await this.issueService.addPledgeAmount(pledge.issue_id, Number(pledge.amount));

    return pledge.reload({ include: this.defaultInclude });
  }
}
