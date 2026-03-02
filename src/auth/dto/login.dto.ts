import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@trace.ps' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Test@1234' })
  @IsNotEmpty()
  password!: string;
}