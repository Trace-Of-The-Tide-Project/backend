import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── PAGES ──────────────────────────────────────────────────

export class CreatePageDto {
  @ApiProperty({ example: 'About Us' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'about-us' })
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ example: 'static', enum: ['homepage', 'static', 'custom'] })
  @IsOptional()
  @IsString()
  page_type?: string;

  @ApiPropertyOptional({ example: '<h1>About Us</h1><p>Our story...</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seo_title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meta_description?: string;
}

export class UpdatePageDto extends PartialType(CreatePageDto) {
  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsString()
  status?: string;
}

// ─── PAGE SECTIONS ──────────────────────────────────────────

export class CreatePageSectionDto {
  @ApiProperty({ example: 'hero', enum: ['hero', 'featured', 'categories', 'top_creators', 'call_to_action', 'custom'] })
  @IsNotEmpty()
  @IsString()
  section_type!: string;

  @ApiProperty({ example: 'Hero Section' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  section_order!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @ApiPropertyOptional({
    example: '{"headline":"Discover. Create. Inspire.","subheadline":"Join a community...","primary_cta":"Contribute now","background_image":"hero.jpg"}',
    description: 'JSON config specific to section type',
  })
  @IsOptional()
  @IsString()
  config?: string;
}

export class UpdatePageSectionDto extends PartialType(CreatePageSectionDto) {}

// ─── SITE SETTINGS ──────────────────────────────────────────

export class UpdateSiteSettingsDto {
  @ApiProperty({ example: 'navigation', description: 'Setting key' })
  @IsNotEmpty()
  @IsString()
  key!: string;

  @ApiProperty({
    example: '{"links":[{"label":"Home","url":"/","order":1,"is_visible":true}]}',
    description: 'JSON value for the setting',
  })
  @IsNotEmpty()
  @IsString()
  value!: string;
}