import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { Follow } from './models/follow.model';
import { User } from '../users/models/user.model';
import { UserProfile } from '../users/models/user-profile.model';
import { UserSettings } from '../author-dashboard/models/user-settings.model';
import { Notification } from '../notifications/models/notification.model';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([
      Follow,
      User,
      UserProfile,
      UserSettings,
      Notification,
    ]),
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
