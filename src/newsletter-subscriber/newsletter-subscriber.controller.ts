import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NewsletterSubscriberService } from './newsletter-subscriber.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';

@ApiTags('Newsletter')
@Controller('newsletter-subscribers')
export class NewsletterSubscriberController {
  constructor(private readonly subscriberService: NewsletterSubscriberService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all subscribers (admin)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'magazine_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query() query: any) {
    return this.subscriberService.findAll(query);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a magazine newsletter (public)' })
  subscribe(@Body() body: { magazine_id: string; email: string; user_id?: string; source?: string }) {
    return this.subscriberService.subscribe(body);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm newsletter subscription (double opt-in link)' })
  confirm(@Param('id') id: string) {
    return this.subscriberService.confirm(id);
  }

  @Patch(':id/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  unsubscribe(@Param('id') id: string) {
    return this.subscriberService.unsubscribe(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subscriber record (admin)' })
  remove(@Param('id') id: string) {
    return this.subscriberService.remove(id);
  }
}
