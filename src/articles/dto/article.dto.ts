import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsArray,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── ARTICLE ────────────────────────────────────────────────

export class CreateArticleDto {
  @ApiProperty({ example: 'The Future of Palestinian Heritage' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'article',
    enum: [
      'article',
      'video',
      'audio',
      'thread',
      'artwork',
      'figma',
      'trip',
      'open_call',
    ],
  })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional({
    example: 'A deep dive into the preservation of cultural heritage...',
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ example: 'cover_heritage.jpg' })
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/video.mp4',
    description: 'Primary media URL for video/audio hero',
  })
  @IsOptional()
  @IsString()
  media_url?: string;

  @ApiPropertyOptional({
    example: 24,
    description: 'Media duration in minutes (video/audio)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  media_duration?: number;

  @ApiPropertyOptional({
    example: 'Edition 01',
    description: 'Edition label displayed as badge',
  })
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiPropertyOptional({ example: 'Documentary' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'en', enum: ['en', 'ar'] })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    example: 'public',
    enum: ['public', 'private', 'unlisted'],
  })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({ example: 'Heritage Preservation in the Digital Age' })
  @IsOptional()
  @IsString()
  seo_title?: string;

  @ApiPropertyOptional({
    example: 'Exploring how digital tools help preserve Palestinian heritage',
  })
  @IsOptional()
  @IsString()
  meta_description?: string;

  @ApiPropertyOptional({ description: 'ISO date for scheduled publishing' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({
    description: 'Collection UUID to link this article to',
  })
  @IsOptional()
  @IsUUID()
  collection_id?: string;

  @ApiPropertyOptional({
    description: 'UUID of the original article this is a translation of',
  })
  @IsOptional()
  @IsUUID()
  translation_of?: string;

  @ApiPropertyOptional({
    description: 'Array of tag IDs to associate',
    example: ['uuid1', 'uuid2'],
  })
  @IsOptional()
  @IsArray()
  tag_ids?: string[];

  @ApiPropertyOptional({
    description: 'Array of content blocks to create with the article',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateArticleBlockDto)
  blocks?: CreateArticleBlockDto[];
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional({
    enum: ['draft', 'published', 'scheduled', 'archived', 'flagged'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}

// ─── BLOCKS ─────────────────────────────────────────────────

export class CreateArticleBlockDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  block_order!: number;

  @ApiProperty({
    example: 'paragraph',
    enum: [
      'paragraph',
      'quote',
      'image',
      'gallery',
      'callout',
      'author_note',
      'divider',
      'video',
      'audio',
      'caption_text',
      'meta_data',
      'statistics',
    ],
  })
  @IsNotEmpty()
  @IsString()
  block_type!: string;

  @ApiPropertyOptional({
    example: 'In the heart of Palestine, stories echo through centuries...',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example:
      '{"url":"image.jpg","alt":"Heritage site","caption":"Old city walls"}',
    description: 'JSON string of block-specific metadata',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class UpdateArticleBlockDto extends PartialType(CreateArticleBlockDto) {}

// ─── CONTRIBUTORS ───────────────────────────────────────────

export class AddContributorDto {
  @ApiProperty({ description: 'User UUID of the contributor' })
  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @ApiPropertyOptional({
    example: 'contributor',
    enum: [
      'main_contributor',
      'co-author',
      'contributor',
      'editor',
      'reviewer',
    ],
  })
  @IsOptional()
  @IsString()
  role?: string;
}
