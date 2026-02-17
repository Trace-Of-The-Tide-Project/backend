import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Comment, Discussion, User]),
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
