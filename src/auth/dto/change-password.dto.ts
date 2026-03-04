import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
