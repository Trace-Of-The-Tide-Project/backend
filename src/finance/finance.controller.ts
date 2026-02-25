import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import { FinanceService } from './finance.service';

@ApiTags('Finance & Payout')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ─── SUMMARY CARDS ───────────────────────────────

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Finance dashboard summary cards' })
  async getSummary() {
    return this.financeService.getFinanceSummary();
  }

  // ─── TAB 1: DONATIONS ────────────────────────────

  @Get('donations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all donations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  async listDonations(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('period') period?: string,
  ) {
    return this.financeService.listDonations({ page, limit, status, period });
  }

  @Get('donations/chart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Donation chart data' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  async getDonationChart(@Query('period') period?: string) {
    return this.financeService.getDonationChart(period);
  }

  @Get('donations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get donation details' })
  async getDonation(@Param('id') id: string) {
    return this.financeService.getDonationById(id);
  }

  // ─── TAB 2: PAYOUTS ──────────────────────────────

  @Get('payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all payouts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'under_review', 'approved', 'rejected', 'completed'] })
  async listPayouts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.financeService.listPayouts({ page, limit, status });
  }

  @Post('payouts/request')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request a payout (creator)' })
  async requestPayout(
    @Req() req: any,
    @Body() body: { amount: number; currency?: string; payment_method: string; payment_details?: string },
  ) {
    return this.financeService.requestPayout(req.user.id, body);
  }

  @Get('payouts/balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my balance (creator)' })
  async getMyBalance(@Req() req: any) {
    return this.financeService.getCreatorBalance(req.user.id);
  }

  @Patch('payouts/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve a payout' })
  async approvePayout(@Param('id') id: string, @Req() req: any) {
    return this.financeService.approvePayout(id, req.user.id);
  }

  @Patch('payouts/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Reject a payout' })
  async rejectPayout(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { reason: string },
  ) {
    return this.financeService.rejectPayout(id, req.user.id, body.reason);
  }

  @Patch('payouts/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Mark payout as completed' })
  async completePayout(@Param('id') id: string) {
    return this.financeService.completePayout(id);
  }

  // ─── TAB 3: SUSPICIOUS ACTIVITY ──────────────────

  @Get('fraud-flags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List suspicious activity flags' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'investigating', 'resolved', 'blocked'] })
  @ApiQuery({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'] })
  async listFraudFlags(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.financeService.listFraudFlags({ page, limit, status, severity });
  }

  @Patch('fraud-flags/:id/investigate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Mark flag as under investigation' })
  async investigateFlag(@Param('id') id: string, @Req() req: any) {
    return this.financeService.investigateFlag(id, req.user.id);
  }

  @Patch('fraud-flags/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Resolve a fraud flag' })
  async resolveFlag(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { notes: string },
  ) {
    return this.financeService.resolveFlag(id, req.user.id, body.notes);
  }

  @Patch('fraud-flags/:id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Block user from suspicious flag' })
  async blockUser(@Param('id') id: string, @Req() req: any) {
    return this.financeService.blockUser(id, req.user.id);
  }

  // ─── TAB 4: INVOICES ─────────────────────────────

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all invoices' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['donation', 'payout', 'platform_fee'] })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'issued', 'paid', 'cancelled'] })
  async listInvoices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.listInvoices({ page, limit, type, status });
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(@Param('id') id: string) {
    return this.financeService.getInvoiceById(id);
  }

  // ─── EXPORT ───────────────────────────────────────

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Export finance report (JSON)' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  async exportReport(@Query('period') period?: string) {
    return this.financeService.exportReport(period);
  }
}