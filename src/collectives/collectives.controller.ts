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
import { CollectivesService } from './collectives.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Collectives')
@Controller('collectives')
export class CollectivesController {
  constructor(private readonly collectivesService: CollectivesService) {}

  // ─── Public endpoints ─────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all collectives with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'created_at' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.collectivesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collective by ID with members' })
  findOne(@Param('id') id: string) {
    return this.collectivesService.findOne(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List all members of a collective' })
  getMembers(@Param('id') id: string) {
    return this.collectivesService.getMembers(id);
  }

  // ─── Protected endpoints ──────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collective' })
  create(@Body() body: any) {
    return this.collectivesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a collective' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.collectivesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a collective' })
  remove(@Param('id') id: string) {
    return this.collectivesService.remove(id);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a member to a collective' })
  addMember(@Param('id') collectiveId: string, @Body() body: any) {
    return this.collectivesService.addMember(
      collectiveId,
      body.user_id,
      body.role,
    );
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from a collective' })
  removeMember(
    @Param('id') collectiveId: string,
    @Param('userId') userId: string,
  ) {
    return this.collectivesService.removeMember(collectiveId, userId);
  }
}