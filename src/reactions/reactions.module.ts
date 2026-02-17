import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';
import { Reaction } from './models/reaction.model';
import { User } from '../users/models/user.model';
import { Comment } from '../comments/models/comment.model';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Reaction, User, Comment]),
  ],
  providers: [ReactionsService],
  controllers: [ReactionsController],
})
export class ReactionsModule {}
