import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsIn,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePhaseDto {
  @ApiProperty({ description: 'Collective UUID this phase belongs to' })
  @IsNotEmpty()
  @IsUUID()
  collective_id!: string;

  @ApiProperty({ example: 'Research & Planning' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Initial research and planning phase' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['planned', 'active', 'completed'] })
  @IsOptional()
  @IsIn(['planned', 'active', 'completed'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdatePhaseDto extends PartialType(CreatePhaseDto) {}

export class ReorderPhasesDto {
  @ApiProperty({
    description: 'Array of phase UUIDs in desired order',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  phase_ids!: string[];
}
