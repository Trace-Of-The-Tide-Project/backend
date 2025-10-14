import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OpenCallsService } from './open-call.service';

@Controller('open-calls')
export class OpenCallsController {
  constructor(private readonly openCallsService: OpenCallsService) {}

  @Post()
  createOpenCall(@Body() body: any) {
    return this.openCallsService.createOpenCall(body);
  }

  @Get()
  findAll() {
    return this.openCallsService.findAllOpenCalls();
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
