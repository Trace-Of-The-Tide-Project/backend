import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';
import { Discussion } from './models/discussion.model';
import { Comment } from '../comments/models/comment.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Collection } from '../collections/models/collection.model';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([
      Discussion,
      Comment,
      User,
      Contribution,
      Collection,
    ]),
  ],
  providers: [DiscussionsService],
  controllers: [DiscussionsController],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
