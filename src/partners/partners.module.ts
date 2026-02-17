import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

import { SequelizeModule } from '@nestjs/sequelize';
import { Partner } from './models/partner.model';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([Partner]),
  ],
  providers: [PartnersService],
  controllers: [PartnersController],
  exports: [PartnersService],
})
export class PartnersModule {}
