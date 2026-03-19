import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Donation } from '../donations/models/donation.model';
import { Payout } from './models/payout.model';
import { Invoice } from './models/invoice.model';
import { FraudFlag } from './models/fraud-flag.model';
import { User } from '../users/models/user.model';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Donation) private donationModel: typeof Donation,
    @InjectModel(Payout) private payoutModel: typeof Payout,
    @InjectModel(Invoice) private invoiceModel: typeof Invoice,
    @InjectModel(FraudFlag) private fraudFlagModel: typeof FraudFlag,
  ) {}

  // ─── SUMMARY CARDS ───────────────────────────────

  async getFinanceSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayDonations, monthlyRevenue, pendingPayouts, platformFees] =
      await Promise.all([
        // Today's donations
        this.donationModel.sum('amount', {
          where: { date: { [Op.gte]: today } },
        }),
        // Monthly revenue
        this.donationModel.sum('amount', {
          where: { date: { [Op.gte]: monthStart } },
        }),
        // Pending payouts
        this.payoutModel.findAndCountAll({
          where: { status: { [Op.in]: ['pending', 'under_review'] } },
        }),
        // Platform fees (10% of monthly revenue)
        this.invoiceModel.sum('platform_fee', {
          where: {
            createdAt: { [Op.gte]: monthStart },
            type: 'donation',
          },
        }),
      ]);

    // Calculate growth vs previous period
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const prevMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );

    const [yesterdayDonations, prevMonthRevenue] = await Promise.all([
      this.donationModel.sum('amount', {
        where: {
          createdAt: { [Op.gte]: yesterday, [Op.lt]: today },
        },
      }),
      this.donationModel.sum('amount', {
        where: {
          createdAt: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart },
        },
      }),
    ]);

    const donationGrowth = yesterdayDonations
      ? Math.round(
          (((todayDonations || 0) - yesterdayDonations) / yesterdayDonations) *
            100,
        )
      : 0;

    const revenueGrowth = prevMonthRevenue
      ? Math.round(
          (((monthlyRevenue || 0) - prevMonthRevenue) / prevMonthRevenue) * 100,
        )
      : 0;

    const pendingTotal = pendingPayouts.rows.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    return {
      today_donations: { amount: todayDonations || 0, growth: donationGrowth },
      monthly_revenue: { amount: monthlyRevenue || 0, growth: revenueGrowth },
      pending_payouts: { amount: pendingTotal, count: pendingPayouts.count },
      platform_fees: { amount: platformFees || 0, rate: 10 },
    };
  }

  // ─── TAB 1: DONATIONS ────────────────────────────

  async listDonations(query: {
    page?: number;
    limit?: number;
    status?: string;
    period?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.status) where.status = query.status;

    if (query.period) {
      const now = new Date();
      const periodMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      };
      const days = periodMap[query.period];
      if (days) {
        const start = new Date(now);
        start.setDate(start.getDate() - days);
        where.createdAt = { [Op.gte]: start };
      }
    }

    const { rows, count } = await this.donationModel.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      donations: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  async getDonationById(id: string) {
    const donation = await this.donationModel.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'username', 'full_name', 'email'] },
      ],
    });
    if (!donation) throw new NotFoundException('Donation not found');
    return donation;
  }

  // Donation chart data for the donations tab
  async getDonationChart(period: string = '30d') {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const days = periodMap[period] || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const data = await this.donationModel.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { createdAt: { [Op.gte]: start } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    return data;
  }

  // ─── TAB 2: PAYOUTS ──────────────────────────────

  async listPayouts(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.status) where.status = query.status;

    const { rows, count } = await this.payoutModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      payouts: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  async requestPayout(
    creatorId: string,
    data: {
      amount: number;
      currency?: string;
      payment_method: string;
      payment_details?: string;
    },
  ) {
    // Check if creator has enough balance (total donations received - already paid out)
    const totalReceived =
      (await this.donationModel.sum('amount', {
        where: { user_id: creatorId, status: 'completed' } as any,
      })) || 0;

    const totalPaidOut =
      (await this.payoutModel.sum('amount', {
        where: {
          creator_id: creatorId,
          status: { [Op.in]: ['approved', 'completed'] },
        },
      })) || 0;

    const pendingPayouts =
      (await this.payoutModel.sum('amount', {
        where: {
          creator_id: creatorId,
          status: { [Op.in]: ['pending', 'under_review'] },
        },
      })) || 0;

    const availableBalance = totalReceived - totalPaidOut - pendingPayouts;

    if (data.amount > availableBalance) {
      throw new BadRequestException(
        `Insufficient balance. Available: $${availableBalance.toFixed(2)}`,
      );
    }

    return this.payoutModel.create({
      creator_id: creatorId,
      amount: data.amount,
      currency: data.currency || 'USD',
      payment_method: data.payment_method,
      payment_details: data.payment_details,
      status: 'pending',
    } as any);
  }

  async approvePayout(payoutId: string, adminId: string) {
    const payout = await this.payoutModel.findByPk(payoutId);
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'pending' && payout.status !== 'under_review') {
      throw new BadRequestException(
        `Cannot approve payout with status: ${payout.status}`,
      );
    }

    await payout.update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    // Auto-generate invoice for payout
    await this.generateInvoice({
      type: 'payout',
      payee_id: payout.creator_id,
      amount: Number(payout.amount),
      platform_fee: 0,
      currency: payout.currency,
    });

    return payout;
  }

  async rejectPayout(payoutId: string, adminId: string, reason: string) {
    const payout = await this.payoutModel.findByPk(payoutId);
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'pending' && payout.status !== 'under_review') {
      throw new BadRequestException(
        `Cannot reject payout with status: ${payout.status}`,
      );
    }

    await payout.update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date(),
      rejection_reason: reason,
    });

    return payout;
  }

  async completePayout(payoutId: string) {
    const payout = await this.payoutModel.findByPk(payoutId);
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'approved') {
      throw new BadRequestException(
        'Payout must be approved before completing',
      );
    }

    await payout.update({
      status: 'completed',
      completed_at: new Date(),
    });

    return payout;
  }

  // Creator's balance
  async getCreatorBalance(creatorId: string) {
    const [totalReceived, totalPaidOut, pendingPayouts] = await Promise.all([
      this.donationModel.sum('amount', {
        where: { user_id: creatorId, status: 'completed' } as any,
      }),
      this.payoutModel.sum('amount', {
        where: {
          creator_id: creatorId,
          status: { [Op.in]: ['approved', 'completed'] },
        },
      }),
      this.payoutModel.sum('amount', {
        where: {
          creator_id: creatorId,
          status: { [Op.in]: ['pending', 'under_review'] },
        },
      }),
    ]);

    return {
      total_received: totalReceived || 0,
      total_paid_out: totalPaidOut || 0,
      pending_payouts: pendingPayouts || 0,
      available_balance:
        (totalReceived || 0) - (totalPaidOut || 0) - (pendingPayouts || 0),
    };
  }

  // ─── TAB 3: SUSPICIOUS ACTIVITY ──────────────────

  async listFraudFlags(query: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;

    const { rows, count } = await this.fraudFlagModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'suspect',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
        {
          model: User,
          as: 'resolver',
          attributes: ['id', 'username', 'full_name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      flags: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  async investigateFlag(flagId: string, adminId: string) {
    const flag = await this.fraudFlagModel.findByPk(flagId);
    if (!flag) throw new NotFoundException('Fraud flag not found');

    await flag.update({ status: 'investigating' });
    return flag;
  }

  async resolveFlag(flagId: string, adminId: string, notes: string) {
    const flag = await this.fraudFlagModel.findByPk(flagId);
    if (!flag) throw new NotFoundException('Fraud flag not found');

    await flag.update({
      status: 'resolved',
      resolved_by: adminId,
      resolution_notes: notes,
      resolved_at: new Date(),
    });

    return flag;
  }

  async blockUser(flagId: string, adminId: string) {
    const flag = await this.fraudFlagModel.findByPk(flagId, {
      include: [{ model: User, as: 'suspect' }],
    });
    if (!flag) throw new NotFoundException('Fraud flag not found');

    // Block the user
    if (flag.suspect) {
      await flag.suspect.update({ status: 'banned' });
    }

    await flag.update({
      status: 'blocked',
      resolved_by: adminId,
      resolved_at: new Date(),
      resolution_notes: 'User blocked due to suspicious activity',
    });

    return flag;
  }

  // Auto-detect suspicious activity (called after each donation)
  async checkForFraud(donationId: string, userId: string, amount: number) {
    const flags: Array<{
      type: string;
      description: string;
      severity: string;
    }> = [];

    // Rule 1: Multiple failed payments in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailed = (await this.donationModel.count({
      where: {
        user_id: userId,
        status: 'failed',
        createdAt: { [Op.gte]: oneHourAgo },
      } as any,
    })) as unknown as number;
    if (recentFailed >= 3) {
      flags.push({
        type: 'multiple_failed_payments',
        description: `${recentFailed} failed payments in the last hour`,
        severity: 'high',
      });
    }

    // Rule 2: Unusually large amount (> $1000)
    if (amount > 1000) {
      flags.push({
        type: 'unusual_amount',
        description: `Large donation amount: $${amount}`,
        severity: 'medium',
      });
    }

    // Rule 3: Rapid transactions (> 5 in last 10 minutes)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const rapidCount = (await this.donationModel.count({
      where: {
        user_id: userId,
        createdAt: { [Op.gte]: tenMinAgo },
      } as any,
    })) as unknown as number;
    if (rapidCount > 5) {
      flags.push({
        type: 'rapid_transactions',
        description: `${rapidCount} transactions in the last 10 minutes`,
        severity: 'critical',
      });
    }

    // Create fraud flags
    for (const f of flags) {
      await this.fraudFlagModel.create({
        flag_type: f.type,
        description: f.description,
        user_id: userId,
        reference_id: donationId,
        reference_type: 'donation',
        amount,
        severity: f.severity,
        status: 'open',
      } as any);
    }

    return flags;
  }

  // ─── TAB 4: INVOICES ─────────────────────────────

  async listInvoices(query: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const { rows, count } = await this.invoiceModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
        {
          model: User,
          as: 'payee',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      invoices: rows,
      total: count,
      page,
      total_pages: Math.ceil(count / limit),
    };
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceModel.findByPk(id, {
      include: [
        { model: Donation },
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
        {
          model: User,
          as: 'payee',
          attributes: ['id', 'username', 'full_name', 'email'],
        },
      ],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async generateInvoice(data: {
    type: string;
    donation_id?: string;
    payer_id?: string;
    payee_id?: string;
    amount: number;
    platform_fee?: number;
    currency?: string;
    notes?: string;
  }) {
    // Generate invoice number: INV-YYYYMMDD-NNN
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const todayCount = await this.invoiceModel.count({
      where: {
        invoice_number: { [Op.like]: `INV-${dateStr}%` },
      },
    });
    const invoiceNumber = `INV-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    const fee = data.platform_fee ?? Math.round(data.amount * 0.1 * 100) / 100;

    return this.invoiceModel.create({
      invoice_number: invoiceNumber,
      type: data.type,
      donation_id: data.donation_id,
      payer_id: data.payer_id,
      payee_id: data.payee_id,
      amount: data.amount,
      platform_fee: fee,
      net_amount: data.amount - fee,
      currency: data.currency || 'USD',
      status: 'issued',
      issued_at: new Date(),
      notes: data.notes,
    } as any);
  }

  // ─── EXPORT ───────────────────────────────────────

  async exportReport(period: string = '30d') {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const days = periodMap[period] || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const [donations, payouts, invoices, flags] = await Promise.all([
      this.donationModel.findAll({
        where: { createdAt: { [Op.gte]: start } },
        include: [{ model: User, attributes: ['username', 'full_name'] }],
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true,
      }),
      this.payoutModel.findAll({
        where: { createdAt: { [Op.gte]: start } },
        raw: true,
        nest: true,
      }),
      this.invoiceModel.findAll({
        where: { createdAt: { [Op.gte]: start } },
        raw: true,
        nest: true,
      }),
      this.fraudFlagModel.findAll({
        where: { createdAt: { [Op.gte]: start } },
        raw: true,
        nest: true,
      }),
    ]);

    return {
      period,
      generated_at: new Date(),
      donations: { count: donations.length, data: donations },
      payouts: { count: payouts.length, data: payouts },
      invoices: { count: invoices.length, data: invoices },
      suspicious_activity: { count: flags.length, data: flags },
    };
  }
}
