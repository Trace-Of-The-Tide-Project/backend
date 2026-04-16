import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateTripDto {
  @ApiProperty({ example: 'Journey Through Old Jerusalem' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'A cultural walking tour through the old city...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'heritage_trip_cover.jpg' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({
    example: 'cultural',
    enum: ['cultural', 'historical', 'educational', 'heritage'],
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Jerusalem → Bethlehem → Hebron' })
  @IsOptional()
  @IsString()
  route_summary?: string;

  @ApiProperty({ example: '2026-04-01T08:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2026-04-03T18:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_participants?: number;

  @ApiPropertyOptional({
    example: 'easy',
    enum: ['easy', 'moderate', 'challenging'],
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  duration_hours?: number;

  @ApiPropertyOptional({
    example: ['heritage', 'walking', 'photography'],
    description: 'Array of tags',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? JSON.stringify(value) : value,
  )
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    example: ['English', 'Arabic'],
    description: 'Array of languages spoken on the trip',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? JSON.stringify(value) : value,
  )
  @IsString()
  languages?: string;

  @ApiPropertyOptional({
    example: ['Visit Al-Aqsa Mosque', 'Local cuisine tasting', 'Damascus Gate tour'],
    description: 'Array of trip highlights',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? JSON.stringify(value) : value,
  )
  @IsString()
  highlights?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Minimum participants required for trip to proceed',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  min_participants?: number;

  @ApiPropertyOptional({
    example: 'Ahmad Khalil',
    description: 'Name of the trip moderator / guide',
  })
  @IsOptional()
  @IsString()
  moderator_name?: string;

  @ApiPropertyOptional({
    example: 'draft',
    enum: ['draft', 'published'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Dynamic application form definition. If set, participants must apply via POST /trips/:id/apply',
    example: {
      fields: [
        { name: 'first_name', type: 'text', required: true, label: 'First Name' },
        { name: 'last_name', type: 'text', required: true, label: 'Last Name' },
        { name: 'email', type: 'email', required: true, label: 'Email Address' },
        { name: 'phone', type: 'text', required: false, label: 'Phone Number' },
        { name: 'experience', type: 'textarea', required: false, label: 'Previous trip experience' },
        { name: 'city', type: 'text', required: false, label: 'City' },
      ],
    },
  })
  @IsOptional()
  application_form?: Record<string, any>;

  @ApiPropertyOptional({
    type: () => [CreateTripStopDto],
    description: 'Inline stops to create with the trip',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTripStopDto)
  stops?: CreateTripStopDto[];
}

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @ApiPropertyOptional({
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateInlineLocationDto {
  @ApiProperty({ example: 'Damascus Gate' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Historic gate in the Old City' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 31.7838 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 35.2296 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Damascus Gate, Old City, Jerusalem' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateTripStopDto {
  @ApiPropertyOptional({ description: 'UUID of existing Location' })
  @IsOptional()
  @IsString()
  location_id?: string;

  @ApiPropertyOptional({
    type: () => CreateInlineLocationDto,
    description: 'Inline location to create with the stop',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInlineLocationDto)
  location?: CreateInlineLocationDto;

  @ApiProperty({
    example: 1,
    description: 'Order of this stop in the trip route',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  stop_order!: number;

  @ApiProperty({ example: 'Al-Aqsa Mosque Visit' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Guided tour of the mosque and surrounding area',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-04-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  arrival_time?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_image?: string;
}

export class UpdateTripStopDto extends PartialType(CreateTripStopDto) {}

export class RegisterParticipantDto {
  @ApiPropertyOptional({
    example: 'participant',
    enum: ['participant', 'guide', 'organizer'],
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'I have mobility needs' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Donation UUID if trip requires payment',
  })
  @IsOptional()
  @IsString()
  donation_id?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Guest name (for non-logged-in users)',
  })
  @IsOptional()
  @IsString()
  guest_name?: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Guest email (for non-logged-in users)',
  })
  @IsOptional()
  @IsEmail()
  guest_email?: string;

  @ApiPropertyOptional({
    example: 150.0,
    description: 'Starting price the participant is willing to pay',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 'Ramallah city center',
    description: 'Where the participant wants to start the trip',
  })
  @IsOptional()
  @IsString()
  start_point?: string;
}
