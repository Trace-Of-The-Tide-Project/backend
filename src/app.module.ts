import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler-exception.guard';
import { APP_GUARD } from '@nestjs/core';

// 🧩 Modules
import { DatabaseModule } from 'src/database/database.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { RolesModule } from 'src/roles/roles.module';
import { ContributionsModule } from 'src/contributions/contributions.module';
import { FilesModule } from 'src/files/files.module';
import { CollectionsModule } from 'src/collections/collections.module';
import { OpenCallsModule } from 'src/open call/open-call.module';
import { DiscussionsModule } from 'src/discussions/discussions.module';
import { CommentsModule } from 'src/comments/comments.module';
import { ReactionsModule } from 'src/reactions/reactions.module';
import { GroupsModule } from 'src/groups/groups.module';
import { CollectivesModule } from 'src/collectives/collectives.module';
import { ReferencesModule } from 'src/references/references.module';
import { PartnersModule } from 'src/partners/partners.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { DonationsModule } from 'src/donations/donations.module';
import { ModerationModule } from 'src/moderation/moderation.module';
import { AuditTrailsModule } from 'src/audit-trails/audit-trails.module';
import { TagsModule } from 'src/tags/tags.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';
import { TripsModule } from 'src/trips/trips.module';
import { ArticlesModule } from 'src/articles/articles.module';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { CmsModule } from 'src/cms/cms.module';
import { FinanceModule } from 'src/finance/finance.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { AuthorDashboardModule } from 'src/author-dashboard/author-dashboard.module';
import { SystemSettingsModule } from 'src/system-settings/system-settings.module';
import { EngagementsModule } from 'src/engagements/engagements.module';
import { PersonModule } from 'src/person/person.module';
import { KnowledgeModule } from 'src/knowledge/knowledge.module';
import { BoardsModule } from 'src/boards/boards.module';
import { LogsModule } from './logs/logs.module';
import { EmailModule } from 'src/email/email.module';
import { FollowsModule } from 'src/follows/follows.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { PhasesModule } from 'src/phases/phases.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    // 🌿 Load environment variables
    ConfigModule.forRoot({ isGlobal: true }),

    // 🧱 Database
    DatabaseModule,

    // ⏰ Scheduled Jobs
    ScheduleModule.forRoot(),

    // 📧 Email (global)
    EmailModule,

    // 🚦 Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 20,
      },
    ]),

    // 🚀 Feature Modules
    UsersModule,
    AuthModule,
    RolesModule,
    ContributionsModule,
    FilesModule,
    CollectionsModule,
    OpenCallsModule,
    DiscussionsModule,
    CommentsModule,
    ReactionsModule,
    GroupsModule,
    CollectivesModule,
    ReferencesModule,
    PartnersModule,
    NotificationsModule,
    DonationsModule,
    LogsModule,
    ModerationModule,
    AuditTrailsModule,
    TagsModule,
    DashboardModule,
    TripsModule,
    ArticlesModule,
    AnalyticsModule,
    CmsModule,
    FinanceModule,
    MessagingModule,
    AuthorDashboardModule,
    SystemSettingsModule,
    EngagementsModule,
    PersonModule,
    KnowledgeModule,
    BoardsModule,
    FollowsModule,
    TasksModule,
    PhasesModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
