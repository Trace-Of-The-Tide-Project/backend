import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiPropertyOptional({ example: 'Fadi Barghouti', description: 'Updates User.full_name' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Fadi' })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiPropertyOptional({ example: 'TechCorp Inc.' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Lead Web Developer' })
  @IsOptional()
  @IsString()
  job_title?: string;

  @ApiPropertyOptional({ example: 'about.me/fadi-b' })
  @IsOptional()
  @IsString()
  personal_link?: string;

  @ApiPropertyOptional({ example: 'Gaza, Palestine' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Senior Frontend Developer with 8+ years of experience...' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    example: { facebook: 'https://fb.com/fadi', twitter: '@fadi', instagram: '', linkedin: '' },
    description: 'Key-value map of social platform to URL/handle',
  })
  @IsOptional()
  @IsObject()
  social_links?: Record<string, string>;
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
