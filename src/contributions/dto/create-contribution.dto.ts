import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsBoolean,
  MaxLength,
  Equals,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContributionDto {
  @ApiPropertyOptional({ description: 'Contribution type UUID' })
  @IsOptional()
  @IsUUID()
  type_id?: string;

  @ApiProperty({ example: "My Grandmother's Story", maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'A personal account of life in Palestine before 1948...',
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    description: 'Collection UUID to add this contribution to',
  })
  @IsOptional()
  @IsUUID()
  collection_id?: string;

  @ApiProperty({ example: 'Ahmad Saleh' })
  @IsNotEmpty()
  @IsString()
  contributor_name!: string;

  @ApiProperty({ example: 'ahmad@example.com' })
  @IsNotEmpty()
  @IsEmail()
  contributor_email!: string;

  @ApiPropertyOptional({ example: '+970599123456' })
  @IsOptional()
  @IsString()
  contributor_phone?: string;

  @ApiPropertyOptional({ example: '+970599000000' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({
    description: 'Must be true — user consents to content review and archival',
    example: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @Equals(true, { message: 'You must give consent to submit a contribution' })
  consent_given!: boolean;

  @ApiPropertyOptional({
    description: 'Open Call UUID if this contribution is for an open call',
  })
  @IsOptional()
  @IsUUID()
  open_call_id?: string;
}
