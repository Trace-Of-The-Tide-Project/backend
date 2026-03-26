import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'Translate article to Arabic' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Full translation of the heritage article' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'UUID of the user to assign the task to' })
  @IsNotEmpty()
  @IsUUID()
  assignee_id!: string;

  @ApiPropertyOptional({ example: 'high', enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @ApiPropertyOptional({ description: 'ISO date string for due date' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ description: 'Linked article UUID' })
  @IsOptional()
  @IsUUID()
  article_id?: string;

  @ApiPropertyOptional({ description: 'Linked contribution UUID' })
  @IsOptional()
  @IsUUID()
  contribution_id?: string;

  @ApiPropertyOptional({ description: 'Linked open call UUID' })
  @IsOptional()
  @IsUUID()
  open_call_id?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'cancelled'])
  status?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
  @IsNotEmpty()
  @IsIn(['pending', 'in_progress', 'completed', 'cancelled'])
  status!: string;
}
