import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { Book } from './models/book.model';
import { KnowledgeArticle } from './models/knowledge-article.model';
import { Adventure } from './models/adventure.model';
import { Location } from './models/location.model';

@Module({
  imports: [SequelizeModule.forFeature([Book, KnowledgeArticle, Adventure, Location])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
