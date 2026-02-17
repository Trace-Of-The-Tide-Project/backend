import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { File } from '../files/models/file.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';
import { FilesService } from '../files/files.service';
import { FilesController } from '../files/files.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([File, Contribution, User]),
  ],
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
