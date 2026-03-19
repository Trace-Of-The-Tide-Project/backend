import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Article } from './models/article.model';
import { ArticleBlock } from './models/article-block.model';
import { ArticleContributor } from './models/article-contributor.model';
import { ArticleTag } from './models/article-tag.model';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([
      Article,
      ArticleBlock,
      ArticleContributor,
      ArticleTag,
    ]),
  ],
  providers: [ArticlesService],
  controllers: [ArticlesController],
  exports: [ArticlesService],
})
export class ArticlesModule {}
