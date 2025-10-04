import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContributionsService } from "./contributions.service";
import { ContributionsController } from "./contributions.controller";
import { Contribution } from "./models/contribution.model";
import { CollectionContribution } from '../collections/models/collection-contribution.model';
import { File } from '../files/models/file.model';


@Module({
  imports: [SequelizeModule.forFeature([
    Contribution,
    CollectionContribution,
    File
  ])],
  providers: [ContributionsService],
  controllers: [ContributionsController],
  exports: [ContributionsService],
})
export class ContributionsModule { }
