import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OpenCallsService } from './open-call.service';

@Controller('open-calls')
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
