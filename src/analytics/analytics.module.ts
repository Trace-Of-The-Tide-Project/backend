import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AuthModule } from '../auth/auth.module';

// Models used for aggregation queries
import { User } from '../users/models/user.model';
import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { Article } from '../articles/models/article.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Donation } from '../donations/models/donation.model';
import { Trip } from '../trips/models/trip.model';
import { TripParticipant } from '../trips/models/trip-participant.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Comment } from '../comments/models/comment.model';
import { Reaction } from '../reactions/models/reaction.model';
import { Collection } from '../collections/models/collection.model';

@Module({
    imports: [
        forwardRef(() => AuthModule),
        SequelizeModule.forFeature([
            User,
            UserRole,
            Role,
            Article,
            Contribution,
            Donation,
            Trip,
            TripParticipant,
            OpenCall,
            Participant,
            Discussion,
            Comment,
            Reaction,
            Collection,
        ]),
    ],
    providers: [AnalyticsService],
    controllers: [AnalyticsController],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }