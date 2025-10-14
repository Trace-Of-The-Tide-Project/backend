import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Reference } from './models/reference.model';
import { ReferencesService } from './references.service';
import { ReferencesController } from './references.controller';

@Module({
  imports: [SequelizeModule.forFeature([Reference])],
  controllers: [ReferencesController],
  providers: [ReferencesService],
  exports: [ReferencesService],
})
export class ReferencesModule {}
