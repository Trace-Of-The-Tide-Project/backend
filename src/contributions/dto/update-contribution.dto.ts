import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateContributionDto } from './create-contribution.dto';

export class UpdateContributionDto extends PartialType(CreateContributionDto) {}

export class UpdateContributionStatusDto {
  @ApiPropertyOptional({ enum: ['draft', 'pending', 'published', 'flagged'] })
  @IsOptional()
  @IsString()
  @IsEnum(['draft', 'pending', 'published', 'flagged'])
  status?: string;
}
