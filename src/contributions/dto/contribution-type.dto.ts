import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContributionTypeDto {
  @ApiProperty({ example: 'Oral History' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Personal stories and oral testimonies' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateContributionTypeDto {
  @ApiPropertyOptional({ example: 'Oral History' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}
