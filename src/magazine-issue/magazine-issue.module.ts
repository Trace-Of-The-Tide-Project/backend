import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { MagazineIssue } from './models/magazine-issue.model';
import { MagazineIssueService } from './magazine-issue.service';
import { MagazineIssueController } from './magazine-issue.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([MagazineIssue]),
  ],
  controllers: [MagazineIssueController],
  providers: [MagazineIssueService],
  exports: [MagazineIssueService],
})
export class MagazineIssueModule {}
