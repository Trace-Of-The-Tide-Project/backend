import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsIn,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Board ────────────────────────────────────────────────

export class CreateBoardDto {
  @ApiProperty({ example: 'Strategy Brainstorm' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @ApiPropertyOptional({ enum: ['private', 'team', 'public'] })
  @IsOptional()
  @IsIn(['private', 'team', 'public'])
  visibility?: string;

  @ApiPropertyOptional({ description: 'JSON string: { grid, minimap, background_color }' })
  @IsOptional()
  @IsString()
  settings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  template_id?: string;
}

export class UpdateBoardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cover_image?: string;

  @ApiPropertyOptional({ enum: ['active', 'archived'] })
  @IsOptional()
  @IsIn(['active', 'archived'])
  status?: string;

  @ApiPropertyOptional({ enum: ['private', 'team', 'public'] })
  @IsOptional()
  @IsIn(['private', 'team', 'public'])
  visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  settings?: string;
}

// ─── Member ───────────────────────────────────────────────

export class AddBoardMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  user_id!: string;

  @ApiPropertyOptional({ enum: ['editor', 'commenter', 'viewer'], default: 'viewer' })
  @IsOptional()
  @IsIn(['editor', 'commenter', 'viewer'])
  role?: string;
}

export class UpdateBoardMemberDto {
  @ApiProperty({ enum: ['editor', 'commenter', 'viewer'] })
  @IsNotEmpty()
  @IsIn(['editor', 'commenter', 'viewer'])
  role!: string;
}

// ─── Page ─────────────────────────────────────────────────

export class CreateBoardPageDto {
  @ApiPropertyOptional({ default: 'New Page' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateBoardPageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page_order?: number;
}

// ─── Element ──────────────────────────────────────────────

export class CreateBoardElementDto {
  @ApiProperty({ enum: ['sticky_note', 'rectangle', 'circle', 'triangle', 'diamond', 'text', 'image', 'article_block', 'layout_grid'] })
  @IsNotEmpty()
  @IsIn(['sticky_note', 'rectangle', 'circle', 'triangle', 'diamond', 'text', 'image', 'article_block', 'layout_grid'])
  element_type!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  x!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  y!: number;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  z_index?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'JSON string of type-specific properties' })
  @IsOptional()
  @IsString()
  properties?: string;
}

export class UpdateBoardElementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  z_index?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  properties?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_locked?: boolean;
}

export class ReorderElementsDto {
  @ApiProperty({ type: [Object], description: 'Array of { id, z_index }' })
  @IsArray()
  items!: { id: string; z_index: number }[];
}

// ─── Connector ────────────────────────────────────────────

export class CreateBoardConnectorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  page_id!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  source_element_id!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  target_element_id!: string;

  @ApiPropertyOptional({ enum: ['straight', 'curved', 'elbow'], default: 'straight' })
  @IsOptional()
  @IsIn(['straight', 'curved', 'elbow'])
  connector_type?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  start_arrow?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  end_arrow?: boolean;

  @ApiPropertyOptional({ description: 'JSON string: { stroke_color, stroke_width, label }' })
  @IsOptional()
  @IsString()
  properties?: string;
}

export class UpdateBoardConnectorDto {
  @ApiPropertyOptional({ enum: ['straight', 'curved', 'elbow'] })
  @IsOptional()
  @IsIn(['straight', 'curved', 'elbow'])
  connector_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  start_arrow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  end_arrow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  properties?: string;
}

// ─── Chat ─────────────────────────────────────────────────

export class CreateBoardChatDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content!: string;
}

// ─── Comment ──────────────────────────────────────────────

export class CreateBoardCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  element_id!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;
}

export class UpdateBoardCommentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: ['open', 'resolved', 'closed'] })
  @IsOptional()
  @IsIn(['open', 'resolved', 'closed'])
  status?: string;
}

// ─── Template ─────────────────────────────────────────────

export class CreateBoardTemplateDto {
  @ApiProperty({ example: 'Brainstorm Map' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ enum: ['editorial', 'planning', 'analysis', 'general'] })
  @IsOptional()
  @IsIn(['editorial', 'planning', 'analysis', 'general'])
  category?: string;

  @ApiProperty({ description: 'JSON string: full board snapshot' })
  @IsNotEmpty()
  @IsString()
  template_data!: string;
}
