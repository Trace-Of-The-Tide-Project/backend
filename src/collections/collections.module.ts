import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { Collection } from './models/collection.model';
import { CollectionContribution } from './models/collection-contribution.model';

@Module({
  imports: [SequelizeModule.forFeature([Collection, CollectionContribution])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
