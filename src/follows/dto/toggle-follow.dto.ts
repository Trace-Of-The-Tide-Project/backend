import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFollowDto {
  @ApiProperty({ description: 'UUID of the user to follow/unfollow' })
  @IsNotEmpty()
  @IsUUID()
  following_id!: string;
}
