import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from './database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from 'src/users/models/user.model';
import { Role } from 'src/roles/models/role.model';
import { UserRole } from 'src/users/models/user-role.model';
import { UserProfile } from 'src/users/models/user-profile.model';
import { File } from 'src/files/models/file.model';
import { Contribution } from 'src/contributions/models/contribution.model';
import { ContributionType } from 'src/contributions/models/contribution-type.model';
import { Collection } from 'src/collections/models/collection.model';
import { CollectionContribution } from 'src/collections/models/collection-contribution.model';
import { OpenCall } from 'src/open call/models/open-call.model';
import { Participant } from 'src/open call/models/participant.model';
import { Discussion } from 'src/discussions/models/discussion.model';
import { Comment } from 'src/comments/models/comment.model';
import { Reaction } from 'src/reactions/models/reaction.model';
import { Group } from 'src/groups/models/group.model';
import { GroupMember } from 'src/groups/models/group-member.model';
import { Collective } from 'src/collectives/models/collective.model';
import { CollectiveMember } from 'src/collectives/models/collective-member.model';
import { BiographicalCard } from 'src/person/models/biographical-card.model';
import { LifeEvent } from 'src/person/models/life-event.model';
import { PersonProfile } from 'src/person/models/person-profile.model';
import { TimelineEvent } from 'src/person/models/timeline-event.model';
import { Location } from 'src/knowledge/models/location.model';
import { Book } from 'src/knowledge/models/book.model';
import { Adventure } from 'src/knowledge/models/adventure.model';
import { KnowledgeArticle } from 'src/knowledge/models/knowledge-article.model';
import { Reference } from 'src/references/models/reference.model';
import { Partner } from 'src/partners/models/partner.model';
import { Notification } from 'src/notifications/models/notification.model';
import { Log } from 'src/logs/models/log.model';
import { Donation } from 'src/donations/models/donation.model';
import { ModerationLog } from 'src/moderation/models/moderation-log.model';
import { AuditTrail } from 'src/audit-trails/models/audit-trail.model';
import { Tag } from 'src/tags/models/tag.model';
import { ContributionTag } from 'src/tags/models/contribution-tag.model';
import { RefreshToken } from 'src/auth/models/refresh-tokens.model';
import { Trip } from 'src/trips/models/trip.model';
import { TripStop } from 'src/trips/models/trip-stop.model';
import { TripParticipant } from 'src/trips/models/trip-participant.model';
import { Article } from 'src/articles/models/article.model';
import { ArticleBlock } from 'src/articles/models/article-block.model';
import { ArticleContributor } from 'src/articles/models/article-contributor.model';
import { ArticleTag } from 'src/articles/models/article-tag.model';
import { Page } from 'src/cms/models/page.model';
import { PageSection } from 'src/cms/models/page-section.model';
import { SiteSettings } from 'src/cms/models/site-settings.model';
import { Invoice } from 'src/finance/models/invoice.model';
import { Payout } from 'src/finance/models/payout.model';
import { FraudFlag } from 'src/finance/models/fraud-flag.model';
import { Conversation } from 'src/messaging/models/conversation.model';
import { Message } from 'src/messaging/models/message.model';
import { Broadcast } from 'src/messaging/models/broadcast.model';
import { MessageTemplate } from 'src/messaging/models/message-template.model';
import { UserSettings } from 'src/author-dashboard/models/user-settings.model';
import { Badge } from 'src/system-settings/models/badge.model';
import { EmailTemplate } from 'src/system-settings/models/email-template.model';
import { UserBadge } from 'src/engagements/models/user-badge.model';
import { Board } from 'src/boards/models/board.model';
import { BoardMember } from 'src/boards/models/board-member.model';
import { BoardPage } from 'src/boards/models/board-page.model';
import { BoardElement } from 'src/boards/models/board-element.model';
import { BoardConnector } from 'src/boards/models/board-connector.model';
import { BoardChat } from 'src/boards/models/board-chat.model';
import { BoardComment } from 'src/boards/models/board-comment.model';
import { BoardTemplate } from 'src/boards/models/board-template.model';
import { Follow } from 'src/follows/models/follow.model';
import { Task } from 'src/tasks/models/task.model';
import { Phase } from 'src/phases/models/phase.model';

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
        dialectOptions: configService.get<any>('database.dialectOptions'),
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
          UserSettings,
          Badge,
          EmailTemplate,
          UserBadge,
          Board,
          BoardMember,
          BoardPage,
          BoardElement,
          BoardConnector,
          BoardChat,
          BoardComment,
          BoardTemplate,
          Follow,
          Task,
          Phase,
        ],
      }),
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
