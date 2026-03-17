import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Board } from './models/board.model';
import { BoardMember } from './models/board-member.model';
import { BoardPage } from './models/board-page.model';
import { BoardElement } from './models/board-element.model';
import { BoardConnector } from './models/board-connector.model';
import { BoardChat } from './models/board-chat.model';
import { BoardComment } from './models/board-comment.model';
import { BoardTemplate } from './models/board-template.model';
import { User } from '../users/models/user.model';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardsGateway } from './boards.gateway';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Board,
      BoardMember,
      BoardPage,
      BoardElement,
      BoardConnector,
      BoardChat,
      BoardComment,
      BoardTemplate,
      User,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsGateway],
  exports: [BoardsService, BoardsGateway],
})
export class BoardsModule {}
