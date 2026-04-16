import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { WriterProfile } from './models/writer-profile.model';
import { WriterProfileService } from './writer-profile.service';
import { WriterProfileController } from './writer-profile.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([WriterProfile]),
  ],
  controllers: [WriterProfileController],
  providers: [WriterProfileService],
  exports: [WriterProfileService],
})
export class WriterProfileModule {}
