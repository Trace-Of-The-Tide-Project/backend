import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { Conversation } from './models/conversation.model';
import { Message } from './models/message.model';
import { Broadcast } from './models/broadcast.model';
import { MessageTemplate } from './models/message-template.model';
import { User } from '../users/models/user.model';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    SequelizeModule.forFeature([Conversation, Message, Broadcast, MessageTemplate, User]),
    JwtModule.registerAsync({
     imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}