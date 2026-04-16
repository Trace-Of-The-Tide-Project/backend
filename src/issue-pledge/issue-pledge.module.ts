import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { IssuePledge } from './models/issue-pledge.model';
import { IssuePledgeService } from './issue-pledge.service';
import { IssuePledgeController } from './issue-pledge.controller';
import { MagazineIssueModule } from 'src/magazine-issue/magazine-issue.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => MagazineIssueModule),
    SequelizeModule.forFeature([IssuePledge]),
  ],
  controllers: [IssuePledgeController],
  providers: [IssuePledgeService],
  exports: [IssuePledgeService],
})
export class IssuePledgeModule {}
