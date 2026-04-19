import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TripsService } from './trips.service';
import {
  CreateTripDto,
  UpdateTripDto,
  CreateTripStopDto,
  UpdateTripStopDto,
  RegisterParticipantDto,
} from './dto/trip.dto';
import { ApplyTripDto } from './dto/apply-trip.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // ═══════════════════════════════════════════════════════════
  // TRIPS CRUD
  // ═══════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({
    summary: 'List all trips with pagination, search, and filters',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title, description, category',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
  })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'sortBy', required: false, example: 'start_date' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    return this.tripsService.findAll(query);
  }

  @Get('archive')
  @ApiOperation({
    summary: 'Get trip archive (completed and cancelled trips)',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getArchive(@Query() query: any) {
    return this.tripsService.getArchive(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip by ID with stops and participants' })
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip (draft)' })
  create(@Body() dto: CreateTripDto, @Req() req: any) {
    return this.tripsService.createTrip(dto, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trip details' })
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.updateTrip(id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft trip (requires at least 1 stop)' })
  publish(@Param('id') id: string) {
    return this.tripsService.publishTrip(id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a completed trip (admin/editor only)' })
  archive(@Param('id') id: string) {
    return this.tripsService.archiveTrip(id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a trip and notify all participants' })
  cancel(@Param('id') id: string) {
    return this.tripsService.cancelTrip(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a trip (admin only)' })
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get trip statistics (participant counts, spots remaining)',
  })
  getStats(@Param('id') id: string) {
    return this.tripsService.getTripStats(id);
  }

  // ═══════════════════════════════════════════════════════════
  // TRIP STOPS
  // ═══════════════════════════════════════════════════════════

  @Get(':id/stops')
  @ApiOperation({ summary: 'Get all stops for a trip (ordered by stop_order)' })
  getStops(@Param('id') id: string) {
    return this.tripsService.getStops(id);
  }

  @Post(':id/stops')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a stop to a trip' })
  addStop(
    @Param('id') id: string,
    @Body() dto: CreateTripStopDto,
    @Req() req: any,
  ) {
    return this.tripsService.addStop(id, dto, req.user.sub);
  }

  @Patch(':id/stops/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder stops — send array of stop IDs in desired order',
  })
  reorderStops(@Param('id') id: string, @Body('stopIds') stopIds: string[]) {
    return this.tripsService.reorderStops(id, stopIds);
  }

  @Patch(':id/stops/:stopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a trip stop' })
  updateStop(
    @Param('id') id: string,
    @Param('stopId') stopId: string,
    @Body() dto: UpdateTripStopDto,
  ) {
    return this.tripsService.updateStop(id, stopId, dto);
  }

  @Delete(':id/stops/:stopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a stop from a trip' })
  removeStop(@Param('id') id: string, @Param('stopId') stopId: string) {
    return this.tripsService.removeStop(id, stopId);
  }

  // ═══════════════════════════════════════════════════════════
  // TRIP PARTICIPANTS
  // ═══════════════════════════════════════════════════════════

  @Get(':id/participants')
  @ApiOperation({ summary: 'List all participants of a trip' })
  getParticipants(@Param('id') id: string) {
    return this.tripsService.getParticipants(id);
  }

  @Post(':id/register')
  @ApiOperation({
    summary:
      'Register for a trip (authenticated or guest, auto-waitlist if full)',
  })
  register(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: RegisterParticipantDto,
  ) {
    const userId = req.user?.sub || null;
    return this.tripsService.registerParticipant(id, userId, dto);
  }

  @Post(':id/apply')
  @ApiOperation({
    summary: 'Apply to a trip via dynamic form (supports file uploads)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, { storage: memoryStorage() }),
  )
  apply(
    @Param('id') id: string,
    @Body() dto: ApplyTripDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.tripsService.applyToTrip(id, dto, files || []);
  }

  @Post(':id/cancel-registration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel current user registration (promotes waitlisted)',
  })
  cancelRegistration(@Param('id') id: string, @Req() req: any) {
    return this.tripsService.cancelRegistration(id, req.user.sub);
  }

  @Patch(':id/participants/:participantId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update participant status (admin/editor)' })
  updateParticipantStatus(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body('status') status: string,
  ) {
    return this.tripsService.updateParticipantStatus(id, participantId, status);
  }
}
