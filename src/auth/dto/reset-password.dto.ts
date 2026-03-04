import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
