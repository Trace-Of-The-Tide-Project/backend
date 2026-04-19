import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @Length(6, 8)
  code: string;
}

export class Validate2FADto {
  @ApiProperty({ description: 'Short-lived temp token returned when login requires 2FA' })
  @IsString()
  temp_token: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 8)
  code: string;
}

export class Disable2FADto {
  @ApiProperty({ description: 'Current account password to confirm identity' })
  @IsString()
  password: string;
}
