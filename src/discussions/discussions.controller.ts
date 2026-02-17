import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('discussions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Post()
  create(@Body() body: any) {
    return this.discussionsService.create(body);
  }

  @Get()
  findAll() {
    return this.discussionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discussionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.discussionsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discussionsService.remove(id);
  }
}
