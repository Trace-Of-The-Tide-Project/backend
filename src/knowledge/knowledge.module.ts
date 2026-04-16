import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { Book } from './models/book.model';
import { BookReview } from './models/book-review.model';
import { KnowledgeArticle } from './models/knowledge-article.model';
import { Adventure } from './models/adventure.model';
import { Location } from './models/location.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Book, BookReview, KnowledgeArticle, Adventure, Location]),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
