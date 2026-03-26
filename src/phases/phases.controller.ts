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
import { PhasesService } from './phases.service';
import { CreatePhaseDto, UpdatePhaseDto, ReorderPhasesDto } from './dto/phase.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Phases')
@Controller('phases')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get()
  @ApiOperation({ summary: 'List all phases with pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: any) {
    return this.phasesService.findAll(query);
  }

  @Get('collective/:collectiveId')
  @ApiOperation({ summary: 'Get phases for a collective (ordered)' })
  findByCollective(
    @Param('collectiveId') collectiveId: string,
    @Query() query: any,
  ) {
    return this.phasesService.findByCollective(collectiveId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get phase by ID' })
  findOne(@Param('id') id: string) {
    return this.phasesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new phase (admin/manager)' })
  create(@Body() dto: CreatePhaseDto) {
    return this.phasesService.create(dto as any);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a phase (admin/manager)' })
  update(@Param('id') id: string, @Body() dto: UpdatePhaseDto) {
    return this.phasesService.update(id, dto as any);
  }

  @Patch('collective/:collectiveId/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder phases within a collective' })
  reorder(
    @Param('collectiveId') collectiveId: string,
    @Body() dto: ReorderPhasesDto,
  ) {
    return this.phasesService.reorder(collectiveId, dto.phase_ids);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a phase (admin/manager)' })
  remove(@Param('id') id: string) {
    return this.phasesService.remove(id);
  }
}
