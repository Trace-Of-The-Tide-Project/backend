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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // ════════════════════ BOOKS ════════════════════

  @Get('books')
  @ApiOperation({ summary: 'List books with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and author',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAllBooks(@Query() query: any) {
    return this.knowledgeService.findAllBooks(query);
  }

  @Get('books/:id')
  @ApiOperation({ summary: 'Get a book by ID' })
  findBookById(@Param('id') id: string) {
    return this.knowledgeService.findBookById(id);
  }

  @Post('books')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a book' })
  createBook(@Body() body: any) {
    return this.knowledgeService.createBook(body);
  }

  @Patch('books/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a book' })
  updateBook(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.updateBook(id, body);
  }

  @Delete('books/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book' })
  deleteBook(@Param('id') id: string) {
    return this.knowledgeService.deleteBook(id);
  }

  // ════════════════════ ARTICLES ════════════════════

  @Get('articles')
  @ApiOperation({
    summary: 'List knowledge articles with search and pagination',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and content',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAllArticles(@Query() query: any) {
    return this.knowledgeService.findAllArticles(query);
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get a knowledge article by ID' })
  findArticleById(@Param('id') id: string) {
    return this.knowledgeService.findArticleById(id);
  }

  @Post('articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a knowledge article' })
  createArticle(@Body() body: any) {
    return this.knowledgeService.createArticle(body);
  }

  @Patch('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a knowledge article' })
  updateArticle(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.updateArticle(id, body);
  }

  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a knowledge article' })
  deleteArticle(@Param('id') id: string) {
    return this.knowledgeService.deleteArticle(id);
  }

  // ════════════════════ ADVENTURES ════════════════════

  @Get('adventures')
  @ApiOperation({ summary: 'List adventures with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAllAdventures(@Query() query: any) {
    return this.knowledgeService.findAllAdventures(query);
  }

  @Get('adventures/:id')
  @ApiOperation({ summary: 'Get an adventure by ID with location' })
  findAdventureById(@Param('id') id: string) {
    return this.knowledgeService.findAdventureById(id);
  }

  @Post('adventures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an adventure' })
  createAdventure(@Body() body: any) {
    return this.knowledgeService.createAdventure(body);
  }

  @Patch('adventures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an adventure' })
  updateAdventure(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.updateAdventure(id, body);
  }

  @Delete('adventures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an adventure' })
  deleteAdventure(@Param('id') id: string) {
    return this.knowledgeService.deleteAdventure(id);
  }

  // ════════════════════ LOCATIONS ════════════════════

  @Get('locations')
  @ApiOperation({ summary: 'List locations with search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in name and address',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  findAllLocations(@Query() query: any) {
    return this.knowledgeService.findAllLocations(query);
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get a location by ID' })
  findLocationById(@Param('id') id: string) {
    return this.knowledgeService.findLocationById(id);
  }

  @Post('locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a location' })
  createLocation(@Body() body: any) {
    return this.knowledgeService.createLocation(body);
  }

  @Patch('locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a location' })
  updateLocation(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.updateLocation(id, body);
  }

  @Delete('locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a location' })
  deleteLocation(@Param('id') id: string) {
    return this.knowledgeService.deleteLocation(id);
  }
}
