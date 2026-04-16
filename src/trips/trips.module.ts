import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Trip } from './models/trip.model';
import { TripStop } from './models/trip-stop.model';
import { TripParticipant } from './models/trip-participant.model';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    StorageModule,
    EmailModule,
    SequelizeModule.forFeature([Trip, TripStop, TripParticipant]),
  ],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
