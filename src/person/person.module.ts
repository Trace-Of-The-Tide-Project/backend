import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { PersonProfile } from './models/person-profile.model';
import { BiographicalCard } from './models/biographical-card.model';
import { LifeEvent } from './models/life-event.model';
import { TimelineEvent } from './models/timeline-event.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([PersonProfile, BiographicalCard, LifeEvent, TimelineEvent, User])],
  providers: [PersonService],
  controllers: [PersonController],
  exports: [PersonService],
})
export class PersonModule {}
