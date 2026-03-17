import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsArray,
  IsObject,
  IsIn,
  Equals,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinCollectiveDto {
  @ApiProperty({ example: 'Ahmad' })
  @IsNotEmpty()
  @IsString()
  first_name!: string;

  @ApiProperty({ example: 'Saleh' })
  @IsNotEmpty()
  @IsString()
  last_name!: string;

  @ApiProperty({ example: 'ahmad@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+970599123456', description: 'Phone number with country code' })
  @IsNotEmpty()
  @IsString()
  phone_number!: string;

  @ApiProperty({ example: 'Photography', description: 'Field of experience' })
  @IsNotEmpty()
  @IsString()
  experience_field!: string;

  @ApiPropertyOptional({ example: ['Project A', 'Project B'], description: 'Selected TTT projects' })
  @IsOptional()
  @IsArray()
  traces?: string[];

  @ApiProperty({ example: 'I am a Palestinian photographer with 10 years of experience...' })
  @IsNotEmpty()
  @IsString()
  about!: string;

  // Social media links
  @ApiPropertyOptional({ example: 'https://facebook.com/user' })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/user' })
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/user' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/user' })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiPropertyOptional({ example: ['https://myportfolio.com'], description: 'Custom links' })
  @IsOptional()
  @IsArray()
  custom_links?: string[];

  @ApiProperty({ description: 'Must be true — agree to terms and privacy policy', example: true })
  @IsNotEmpty()
  @IsBoolean()
  @Equals(true, { message: 'You must agree to the terms and privacy policy' })
  terms_agreed!: boolean;

  // Availability fields
  @ApiPropertyOptional({ example: 'frequently', enum: ['frequently', 'one_time'] })
  @IsOptional()
  @IsIn(['frequently', 'one_time'])
  availability_type?: string;

  @ApiPropertyOptional({ example: ['saturday', 'sunday'], description: 'Selected days of the week' })
  @IsOptional()
  @IsArray()
  availability_days?: string[];

  @ApiPropertyOptional({
    example: { saturday: [{ start: '09:00', end: '17:00' }] },
    description: 'Time slots per day',
  })
  @IsOptional()
  @IsObject()
  availability_slots?: Record<string, { start: string; end: string }[]>;

  @ApiPropertyOptional({ example: '2025-12-30', description: 'Specific date for one-time availability' })
  @IsOptional()
  @IsString()
  availability_date?: string;

  @ApiPropertyOptional({ example: 'Europe/Paris', description: 'Timezone' })
  @IsOptional()
  @IsString()
  availability_timezone?: string;

  @ApiPropertyOptional({ description: 'User UUID if authenticated' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
