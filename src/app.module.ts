import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler-exception.guard';
import { APP_GUARD } from '@nestjs/core';

// 🧩 Modules
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { ContributionsModule } from './contributions/contributions.module';
import { FilesModule } from './files/files.module';
import { CollectionsModule } from './collections/collections.module';
import { OpenCallsModule } from './open call/open-call.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { GroupsModule } from './groups/groups.module';
import { CollectivesModule } from './collectives/collectives.module';
import { ReferencesModule } from './references/references.module';
import { PartnersModule } from './partners/partners.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LogsModule } from './logs/logs.module';
import { DonationsModule } from './donations/donations.module';
import { ModerationModule } from './moderation/moderation.module';
import { AuditTrailsModule } from './audit-trails/audit-trails.module';
import { TagsModule } from './tags/tags.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // 🌿 Load environment variables
    ConfigModule.forRoot({ isGlobal: true }),

    // 🧱 Database
    DatabaseModule,

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
