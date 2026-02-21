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
import { PersonService } from './person.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('People')
@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  // ════════════════════ PROFILES ════════════════════

  @Get()
  @ApiOperation({ summary: 'List person profiles with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in full_name and biography' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'full_name' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.personService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a person profile with biographical cards, life events, and timeline' })
  findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a person profile' })
  create(@Body() body: any) {
    return this.personService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a person profile' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.personService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a person profile' })
  remove(@Param('id') id: string) {
    return this.personService.remove(id);
  }

  // ════════════════════ BIOGRAPHICAL CARDS ════════════════════

  @Get(':id/cards')
  @ApiOperation({ summary: 'Get biographical cards for a person' })
  getCards(@Param('id') id: string) {
    return this.personService.getCards(id);
  }

  @Post(':id/cards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a biographical card to a person' })
  createCard(@Param('id') id: string, @Body() body: any) {
    return this.personService.createCard(id, body);
  }

  @Patch('cards/:cardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a biographical card' })
  updateCard(@Param('cardId') cardId: string, @Body() body: any) {
    return this.personService.updateCard(cardId, body);
  }

  @Delete('cards/:cardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a biographical card' })
  deleteCard(@Param('cardId') cardId: string) {
    return this.personService.deleteCard(cardId);
  }

  // ════════════════════ LIFE EVENTS ════════════════════

  @Get(':id/life-events')
  @ApiOperation({ summary: 'Get life events for a person (chronological)' })
  getLifeEvents(@Param('id') id: string) {
    return this.personService.getLifeEvents(id);
  }

  @Post(':id/life-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a life event to a person' })
  createLifeEvent(@Param('id') id: string, @Body() body: any) {
    return this.personService.createLifeEvent(id, body);
  }

  @Patch('life-events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a life event' })
  updateLifeEvent(@Param('eventId') eventId: string, @Body() body: any) {
    return this.personService.updateLifeEvent(eventId, body);
  }

  @Delete('life-events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a life event' })
  deleteLifeEvent(@Param('eventId') eventId: string) {
    return this.personService.deleteLifeEvent(eventId);
  }

  // ════════════════════ TIMELINE EVENTS ════════════════════

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get timeline events for a person (chronological)' })
  getTimelineEvents(@Param('id') id: string) {
    return this.personService.getTimelineEvents(id);
  }

  @Post(':id/timeline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a timeline event to a person' })
  createTimelineEvent(@Param('id') id: string, @Body() body: any) {
    return this.personService.createTimelineEvent(id, body);
  }

  @Patch('timeline/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a timeline event' })
  updateTimelineEvent(@Param('eventId') eventId: string, @Body() body: any) {
    return this.personService.updateTimelineEvent(eventId, body);
  }

  @Delete('timeline/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a timeline event' })
  deleteTimelineEvent(@Param('eventId') eventId: string) {
    return this.personService.deleteTimelineEvent(eventId);
  }
}