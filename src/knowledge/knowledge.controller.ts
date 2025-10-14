import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
    constructor(private readonly knowledgeService: KnowledgeService) { }

    // -------- BOOKS --------
    @Post('books')
    createBook(@Body() body: any) {
        return this.knowledgeService.createBook(body);
    }

    @Get('books')
    findAllBooks() {
        return this.knowledgeService.findAllBooks();
    }

    @Get('books/:id')
    findBookById(@Param('id') id: string) {
        return this.knowledgeService.findBookById(id);
    }

    // -------- ARTICLES --------
    @Post('articles')
    createArticle(@Body() body: any) {
        return this.knowledgeService.createArticle(body);
    }

    @Get('articles')
    findAllArticles() {
        return this.knowledgeService.findAllArticles();
    }

    // -------- ADVENTURES --------
    @Post('adventures')
    createAdventure(@Body() body: any) {
        return this.knowledgeService.createAdventure(body);
    }

    @Get('adventures')
    findAllAdventures() {
        return this.knowledgeService.findAllAdventures();
    }

    // -------- LOCATIONS --------
    @Post('locations')
    createLocation(@Body() body: any) {
        return this.knowledgeService.createLocation(body);
    }

    @Get('locations')
    findAllLocations() {
        return this.knowledgeService.findAllLocations();
    }
}
