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
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IssuePledgeService } from './issue-pledge.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@ApiTags('Issue Pledges')
@Controller('issue-pledges')
export class IssuePledgeController {
  constructor(private readonly pledgeService: IssuePledgeService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all pledges (admin)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'issue_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query() query: any) {
    return this.pledgeService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pledge by ID' })
  findOne(@Param('id') id: string) {
    return this.pledgeService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a pledge (public — guest or authenticated)' })
  create(@Body() body: any) {
    return this.pledgeService.create(body);
  }

  @Post(':id/capture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark pledge as captured (called by payment webhook)' })
  capture(@Param('id') id: string) {
    return this.pledgeService.capture(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a pledge' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.pledgeService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a pledge' })
  remove(@Param('id') id: string) {
    return this.pledgeService.remove(id);
  }
}
