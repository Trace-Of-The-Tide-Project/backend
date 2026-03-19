import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsBoolean,
  Equals,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinOpenCallDto {
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

  @ApiProperty({
    example: '+970599123456',
    description: 'Phone number with country code',
  })
  @IsNotEmpty()
  @IsString()
  phone_number!: string;

  @ApiProperty({ example: 'Photography', description: 'Field of experience' })
  @IsNotEmpty()
  @IsString()
  experience_field!: string;

  @ApiProperty({
    example: 'I am a Palestinian photographer with 10 years of experience...',
  })
  @IsNotEmpty()
  @IsString()
  about!: string;

  @ApiProperty({ example: 'Palestine' })
  @IsNotEmpty()
  @IsString()
  country!: string;

  @ApiProperty({ example: 'Gaza' })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiProperty({
    description: 'Must be true — agree to terms and privacy policy',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  @Equals(true, { message: 'You must agree to the terms and privacy policy' })
  terms_agreed!: boolean;

  @ApiPropertyOptional({ description: 'User UUID if authenticated' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
