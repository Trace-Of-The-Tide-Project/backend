import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Donation } from '../donations/models/donation.model';
import { Payout } from './models/payout.model';
import { Invoice } from './models/invoice.model';
import { FraudFlag } from './models/fraud-flag.model';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Donation, Payout, Invoice, FraudFlag]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}