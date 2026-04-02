import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsIn,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateOpenCallDto {
  @ApiProperty({ example: 'Palestinian Photography Archive 2024' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Content blocks array: [{type, value, order}]',
    example: [
      { type: 'paragraph', value: 'Introduction text...', order: 1 },
      { type: 'image', value: 'https://example.com/photo.jpg', order: 2 },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  content_blocks!: { type: string; value: string | string[]; order: number }[];

  @ApiProperty({
    description: 'Dynamic application form definition',
    example: {
      fields: [
        { name: 'first_name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'experience_field', type: 'select', required: true, options: ['Design', 'Writing'] },
        { name: 'terms_agreement', type: 'checkbox', required: true },
      ],
    },
  })
  @IsNotEmpty()
  @IsObject()
  application_form!: {
    fields: {
      name: string;
      type: string;
      required: boolean;
      options?: string[];
      max_files?: number;
      allowed_types?: string[];
      max_size_mb?: number;
    }[];
  };

  @ApiProperty({
    description: 'Settings: {status, category, tags, language, visibility}',
    example: {
      status: 'draft',
      category: 'Photography',
      tags: ['heritage', 'art'],
      language: 'en',
      visibility: 'public',
    },
  })
  @IsNotEmpty()
  @IsObject()
  settings!: {
    status: string;
    category?: string;
    tags?: string[];
    language?: string;
    visibility?: string;
  };

  @ApiProperty({
    description: 'Action to take: publish (live now), draft (save only), schedule (publish later)',
    enum: ['publish', 'draft', 'schedule'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['publish', 'draft', 'schedule'])
  action!: string;

  @ApiPropertyOptional({
    description: 'Main media: {type, url, size_mb}',
    example: { type: 'image', url: 'https://example.com/cover.jpg', size_mb: 5 },
  })
  @IsOptional()
  @IsObject()
  main_media?: { type: string; url: string; size_mb: number };

  @ApiPropertyOptional({
    description: 'SEO metadata',
    example: { title: 'Open Call — Trace of the Tide', meta_description: 'Submit your work...' },
  })
  @IsOptional()
  @IsObject()
  seo?: { title: string; meta_description: string };

  @ApiPropertyOptional({ description: 'Scheduled publish date (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({
    example:
      'We are collecting photographs documenting daily life in Palestine...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Photography' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Edition 3' })
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiPropertyOptional({ description: 'ISO date string for call start' })
  @IsOptional()
  @IsDateString()
  timeline_start?: string;

  @ApiPropertyOptional({ description: 'ISO date string for call deadline' })
  @IsOptional()
  @IsDateString()
  timeline_end?: string;

  @ApiPropertyOptional({ description: 'Rich text / HTML body content' })
  @IsOptional()
  @IsString()
  body_content?: string;

  @ApiPropertyOptional({ description: 'Cover image URL or path' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({ description: 'Author / organizer name' })
  @IsOptional()
  @IsString()
  author_name?: string;

  @ApiPropertyOptional({
    description: 'Content type for filtering',
    enum: ['article', 'video', 'audio', 'slide'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['article', 'video', 'audio', 'slide'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Publication or event date (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description:
      'Toolkit / resources for contributors (JSON string — guidelines, templates, links)',
    example:
      '{"guidelines":"Submit high-res photos","templates":["template1.pdf"],"links":["https://example.com/guide"]}',
  })
  @IsOptional()
  @IsString()
  toolkit?: string;

  @ApiPropertyOptional({ description: 'Creator user UUID' })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiPropertyOptional({
    description: 'Tags array',
    example: ['photography', 'heritage'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Language', enum: ['en', 'ar'] })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'ar'])
  language?: string;

  @ApiPropertyOptional({ description: 'Visibility', enum: ['public', 'private'] })
  @IsOptional()
  @IsString()
  @IsIn(['public', 'private'])
  visibility?: string;
}

export class UpdateOpenCallDto extends PartialType(CreateOpenCallDto) {}
