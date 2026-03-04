import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Page } from './models/page.model';
import { PageSection } from './models/page-section.model';
import { SiteSettings } from './models/site-settings.model';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Page, PageSection, SiteSettings]),
  ],
  providers: [CmsService],
  controllers: [CmsController],
  exports: [CmsService],
})
export class CmsModule {}