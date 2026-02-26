import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EngagementsController } from './engagements.controller';
import { EngagementsService } from './engagements.service';
import { UserBadge } from './models/user-badge.model';
import { Comment } from '../comments/models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { Reaction } from '../reactions/models/reaction.model';
import { Badge } from '../system-settings/models/badge.model';
import { User } from '../users/models/user.model';
import { ModerationLog } from '../moderation/models/moderation-log.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserBadge,
      Comment,
      Discussion,
      Reaction,
      Badge,
      User,
      ModerationLog,
    ]),
  ],
  controllers: [EngagementsController],
  providers: [EngagementsService],
  exports: [EngagementsService],
})
export class EngagementsModule {}