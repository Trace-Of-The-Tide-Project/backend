import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tag } from './models/tag.model';
import { ContributionTag } from './models/contribution-tag.model';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [SequelizeModule.forFeature([Tag, ContributionTag])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
