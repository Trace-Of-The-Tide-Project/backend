import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { ToggleFollowDto } from './dto/toggle-follow.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow or unfollow a user (toggle)' })
  toggle(@Body() dto: ToggleFollowDto, @Req() req: any) {
    return this.followsService.toggleFollow(req.user.sub, dto.following_id);
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFollowers(@Param('userId') userId: string, @Query() query: any) {
    return this.followsService.getFollowers(userId, query);
  }

  @Get(':userId/following')
  @ApiOperation({ summary: 'Get users this user is following' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFollowing(@Param('userId') userId: string, @Query() query: any) {
    return this.followsService.getFollowing(userId, query);
  }

  @Get(':userId/counts')
  @ApiOperation({ summary: 'Get follower and following counts' })
  getCounts(@Param('userId') userId: string) {
    return this.followsService.getFollowCounts(userId);
  }

  @Get('check/:followingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user follows a given user' })
  checkFollow(@Param('followingId') followingId: string, @Req() req: any) {
    return this.followsService.isFollowing(req.user.sub, followingId);
  }
}
