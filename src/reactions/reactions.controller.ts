import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@Controller('reactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @Roles('user', 'admin')
  create(@Body() body: any) {
    return this.reactionsService.create(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.reactionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reactionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.reactionsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reactionsService.remove(id);
  }
}
