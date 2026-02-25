import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from './database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../users/models/user.model';
import { Role } from '../roles/models/role.model';
import { UserRole } from '../users/models/user-role.model';
import { UserProfile } from '../users/models/user-profile.model';
import { File } from '../files/models/file.model';
import { Contribution } from '../contributions/models/contribution.model';
import { ContributionType } from '../contributions/models/contribution-type.model';
import { Collection } from '../collections/models/collection.model';
import { CollectionContribution } from '../collections/models/collection-contribution.model';
import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Comment } from '../comments/models/comment.model';
import { Reaction } from '../reactions/models/reaction.model';
import { Group } from '../groups/models/group.model';
import { GroupMember } from '../groups/models/group-member.model';
import { Collective } from '../collectives/models/collective.model';
import { CollectiveMember } from '../collectives/models/collective-member.model';
import { BiographicalCard } from '../person/models/biographical-card.model';
import { LifeEvent } from '../person/models/life-event.model';
import { PersonProfile } from '../person/models/person-profile.model';
import { TimelineEvent } from '../person/models/timeline-event.model';
import { Location } from '../knowledge/models/location.model';
import { Book } from '../knowledge/models/book.model';
import { Adventure } from '../knowledge/models/adventure.model';
import { KnowledgeArticle } from '../knowledge/models/knowledge-article.model';
import { Reference } from '../references/models/reference.model';
import { Partner } from '../partners/models/partner.model';
import { Notification } from '../notifications/models/notification.model';
import { Log } from '../logs/models/log.model';
import { Donation } from '../donations/models/donation.model';
import { ModerationLog } from '../moderation/models/moderation-log.model';
import { AuditTrail } from '../audit-trails/models/audit-trail.model';
import { Tag } from '../tags/models/tag.model';
import { ContributionTag } from 'src/tags/models/contribution-tag.model';
import { RefreshToken } from 'src/auth/models/refresh-tokens.model';
import { Trip } from '../trips/models/trip.model';
import { TripStop } from '../trips/models/trip-stop.model';
import { TripParticipant } from '../trips/models/trip-participant.model';
import { Article } from 'src/articles/models/article.model';
import { ArticleBlock } from 'src/articles/models/article-block.model';
import { ArticleContributor } from 'src/articles/models/article-contributor.model';
import { ArticleTag } from 'src/articles/models/article-tag.model';
import { Page } from '../cms/models/page.model';
import { PageSection } from '../cms/models/page-section.model';
import { SiteSettings } from '../cms/models/site-settings.model';
import { Invoice } from '../finance/models/invoice.model';
import { Payout } from '../finance/models/payout.model';
import { FraudFlag } from '../finance/models/fraud-flag.model';
import { Conversation } from '../messaging/models/conversation.model';
import { Message } from '../messaging/models/message.model';
import { Broadcast } from '../messaging/models/broadcast.model';
import { MessageTemplate } from '../messaging/models/message-template.model';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadModels: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<any>('database.logging'),
        models: [
          User,
          Role,
          UserRole,
          UserProfile,
          File,
          Contribution,
          ContributionType,
          Collection,
          CollectionContribution,
          OpenCall,
          Participant,
          Discussion,
          Comment,
          Reaction,
          Group,
          GroupMember,
          Collective,
          CollectiveMember,
          BiographicalCard,
          LifeEvent,
          TimelineEvent,
          PersonProfile,
          Location,
          Book,
          Adventure,
          KnowledgeArticle,
          Reference,
          Partner,
          Notification,
          Log,
          Donation,
          ModerationLog,
          AuditTrail,
          Tag,
          ContributionTag,
          RefreshToken,
          Trip,
          TripStop,
          TripParticipant,
          Article,
          ArticleBlock,
          ArticleContributor,
          ArticleTag,
          Page,
          PageSection,
          SiteSettings,
          Invoice,
          Payout,
          FraudFlag,
          Conversation,
          Message,
          Broadcast,
          MessageTemplate,
        ],
      }),
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule { }
