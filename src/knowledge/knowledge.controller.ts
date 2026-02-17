import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // -------- BOOKS --------
  @Post('books')
  createBook(@Body() body: any) {
    return this.knowledgeService.createBook(body);
  }

  @Get('books')
  findAllBooks(@Query() query: any) {
    return this.knowledgeService.findAllBooks(query);
  }

  @Get('books/:id')
  findBookById(@Param('id') id: string) {
    return this.knowledgeService.findBookById(id);
  }

  @Patch('books/:id')
  updateBook(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.updateBook(id, body);
  }

  @Delete('books/:id')
  deleteBook(@Param('id') id: string) {
    return this.knowledgeService.deleteBook(id);
  }

  // -------- ARTICLES --------
  @Post('articles')
  createArticle(@Body() body: any) {
    return this.knowledgeService.createArticle(body);
  }

  @Get('articles')
  findAllArticles(@Query() query: any) {
    return this.knowledgeService.findAllArticles(query);
  }

  @Get('articles/:id')
  findArticleById(@Param('id') id: string) {
    return this.knowledgeService.findArticleById(id);
  }

  // -------- ADVENTURES --------
  @Post('adventures')
  createAdventure(@Body() body: any) {
    return this.knowledgeService.createAdventure(body);
  }

  @Get('adventures')
  findAllAdventures(@Query() query: any) {
    return this.knowledgeService.findAllAdventures(query);
  }

  // -------- LOCATIONS --------
  @Post('locations')
  createLocation(@Body() body: any) {
    return this.knowledgeService.createLocation(body);
  }

  @Get('locations')
  findAllLocations(@Query() query: any) {
    return this.knowledgeService.findAllLocations(query);
  }
}
