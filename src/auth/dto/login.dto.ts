import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@trace.ps',
    description: 'Email or username',
  })
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @ApiProperty({ example: 'Test@1234' })
  @IsNotEmpty()
  password!: string;
}
