import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { BookClubSelection } from './models/book-club-selection.model';
import { BookClubService } from './book-club.service';
import { BookClubController } from './book-club.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([BookClubSelection]),
  ],
  controllers: [BookClubController],
  providers: [BookClubService],
  exports: [BookClubService],
})
export class BookClubModule {}
