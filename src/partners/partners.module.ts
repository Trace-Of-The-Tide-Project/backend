import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Partner } from './models/partner.model';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  imports: [SequelizeModule.forFeature([Partner])],
  providers: [PartnersService],
  controllers: [PartnersController],
  exports: [PartnersService],
})
export class PartnersModule {}
