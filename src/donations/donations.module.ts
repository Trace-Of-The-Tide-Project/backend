import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Donation } from './models/donation.model';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';

@Module({
  imports: [SequelizeModule.forFeature([Donation])],
  providers: [DonationsService],
  controllers: [DonationsController],
  exports: [DonationsService],
})
export class DonationsModule {}
