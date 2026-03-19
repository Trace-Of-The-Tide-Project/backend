import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { Badge } from './models/badge.model';
import { EmailTemplate } from './models/email-template.model';
import { ContributionType } from '../contributions/models/contribution-type.model';
import { Tag } from '../tags/models/tag.model';
import { ContributionTag } from '../tags/models/contribution-tag.model';
import { SiteSettings } from '../cms/models/site-settings.model';
import { Contribution } from '../contributions/models/contribution.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Badge,
      EmailTemplate,
      ContributionType,
      Tag,
      ContributionTag,
      SiteSettings,
      Contribution,
    ]),
  ],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
