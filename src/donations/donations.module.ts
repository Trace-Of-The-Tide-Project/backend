import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { Donation } from './models/donation.model';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Donation]),
  ],
  providers: [DonationsService],
  controllers: [DonationsController],
  exports: [DonationsService],
})
export class DonationsModule {}
