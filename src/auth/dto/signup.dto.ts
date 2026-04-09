import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
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
