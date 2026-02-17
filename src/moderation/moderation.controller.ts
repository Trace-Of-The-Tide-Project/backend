import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  create(@Body() body: any) {
    return this.moderationService.create(body);
  }

  @Get()
  findAll() {
    // تمرير object فاضي لتفادي خطأ ts(2554)
    return this.moderationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moderationService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moderationService.remove(id);
  }
}
