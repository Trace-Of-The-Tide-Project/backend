import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/models/user.model';
import { UserProfile } from '../users/models/user-profile.model';
import { UserSettings } from './models/user-settings.model';
import { Article } from '../articles/models/article.model';
import { ArticleContributor } from '../articles/models/article-contributor.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Donation } from '../donations/models/donation.model';
import { AuthorDashboardController } from './author-dashboard.controller';
import { AuthorDashboardService } from './author-dashboard.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      UserProfile,
      UserSettings,
      Article,
      ArticleContributor,
      Contribution,
      Donation,
    ]),
  ],
  controllers: [AuthorDashboardController],
  providers: [AuthorDashboardService],
  exports: [AuthorDashboardService],
})
export class AuthorDashboardModule {}
