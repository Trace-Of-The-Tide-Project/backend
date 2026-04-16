import {
  IsNotEmpty,
  IsObject,
  IsBoolean,
  Equals,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyTripDto {
  @ApiProperty({
    description: 'Dynamic form answers matching the trip application_form fields',
    example: {
      first_name: 'Ahmad',
      last_name: 'Saleh',
      email: 'ahmad@example.com',
      phone: '+970599123456',
      experience: 'I have joined 3 cultural trips before...',
      city: 'Gaza',
    },
  })
  @IsNotEmpty()
  @IsObject()
  answers!: Record<string, any>;

  @ApiProperty({
    description: 'Must be true — agree to terms and privacy policy',
    example: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @Equals(true, { message: 'You must agree to the terms and privacy policy' })
  terms_agreement!: boolean;

  @ApiPropertyOptional({ description: 'User UUID if authenticated' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
