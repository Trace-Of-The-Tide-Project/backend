// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { TokenService } from './token.service';
import { DashboardModule } from '../dashboard/dashboard.module';
import { CollectionsModule } from '../collections/collections.module';
import { CollectivesModule } from '../collectives/collectives.module';
import { CommentsModule } from '../comments/comments.module';
import { ContributionsModule } from '../contributions/contributions.module';
import { DiscussionsModule } from '../discussions/discussions.module';
import { DonationsModule } from '../donations/donations.module';
import { FilesModule } from '../files/files.module';
import { GroupsModule } from '../groups/groups.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OpenCallsModule } from '../open call/open-call.module';
import { PartnersModule } from '../partners/partners.module';
import { PersonModule } from '../person/person.module';
import { ReactionsModule } from '../reactions/reactions.module';
import { ReferencesModule } from '../references/references.module';
import { TagsModule } from '../tags/tags.module';
import { LogsModule } from '../logs/logs.module';
import { AuditTrailsModule } from '../audit-trails/audit-trails.module';
@Module({
  imports: [
    forwardRef(() => ReferencesModule),
    forwardRef(() => TagsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
    forwardRef(() => DashboardModule),
    forwardRef(() => CollectionsModule),
    forwardRef(() => CollectivesModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => ContributionsModule),
    forwardRef(() => DiscussionsModule),
    forwardRef(() => DonationsModule),
    forwardRef(() => FilesModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => KnowledgeModule),
    forwardRef(() => ModerationModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => OpenCallsModule),
    forwardRef(() => PartnersModule),
    forwardRef(() => PersonModule),
    forwardRef(() => ReactionsModule),
    forwardRef(() => LogsModule),
    forwardRef(() => AuditTrailsModule),

    PassportModule,
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, TokenService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
