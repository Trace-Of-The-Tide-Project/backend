import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OpenCallsService } from './open-call.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('open-calls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OpenCallsController {
  constructor(private readonly openCallsService: OpenCallsService) {}

  @Post()
  create(@Body() body: any) {
    return this.openCallsService.createOpenCall(body);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.openCallsService.findAllOpenCalls(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.openCallsService.findOne(id);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Body() body: any) {
    return this.openCallsService.joinOpenCall({ ...body, open_call_id: id });
  }
}
