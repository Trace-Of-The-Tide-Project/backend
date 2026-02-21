import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'ahmad_writer' })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({ example: 'ahmad@trace.ps' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Test@1234', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'Ahmad Khalil' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: '+970591234567' })
  @IsOptional()
  @IsString()
  phone_number?: string;
}