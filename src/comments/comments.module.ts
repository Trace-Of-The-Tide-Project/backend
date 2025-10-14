import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { User } from '../users/models/user.model';

@Module({
    imports: [SequelizeModule.forFeature([Comment, Discussion, User])],
    providers: [CommentsService],
    controllers: [CommentsController],
})
export class CommentsModule { }
