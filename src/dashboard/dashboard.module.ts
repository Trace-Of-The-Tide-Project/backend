import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { UserProfile } from '../users/models/user-profile.model';
import { Role } from '../roles/models/role.model';
import { Contribution } from '../contributions/models/contribution.model';
import { ContributionType } from '../contributions/models/contribution-type.model';
import { File } from '../files/models/file.model';
import { Donation } from '../donations/models/donation.model';
import { Comment } from '../comments/models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Reaction } from '../reactions/models/reaction.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Collection } from '../collections/models/collection.model';
import { ModerationLog } from '../moderation/models/moderation-log.model';
import { Log } from '../logs/models/log.model';
import { AuditTrail } from '../audit-trails/models/audit-trail.model';
import { Notification } from '../notifications/models/notification.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      UserRole,
      UserProfile,
      Role,
      Contribution,
      ContributionType,
      File,
      Donation,
      Comment,
      Discussion,
      Reaction,
      OpenCall,
      Participant,
      Collection,
      ModerationLog,
      Log,
      AuditTrail,
      Notification,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}