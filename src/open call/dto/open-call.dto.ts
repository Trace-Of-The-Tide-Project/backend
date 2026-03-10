import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateOpenCallDto {
  @ApiProperty({ example: 'Palestinian Photography Archive 2024' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'We are collecting photographs documenting daily life in Palestine...' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 'Photography' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: 'Edition 3' })
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiProperty({ description: 'ISO date string for call start' })
  @IsNotEmpty()
  @IsDateString()
  timeline_start!: string;

  @ApiProperty({ description: 'ISO date string for call deadline' })
  @IsNotEmpty()
  @IsDateString()
  timeline_end!: string;

  @ApiPropertyOptional({ description: 'Rich text / HTML body content' })
  @IsOptional()
  @IsString()
  body_content?: string;

  @ApiPropertyOptional({ description: 'Cover image URL or path' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({ description: 'Author / organizer name' })
  @IsOptional()
  @IsString()
  author_name?: string;

  @ApiPropertyOptional({ description: 'Creator user UUID' })
  @IsOptional()
  @IsUUID()
  created_by?: string;
}

export class UpdateOpenCallDto extends PartialType(CreateOpenCallDto) {}
