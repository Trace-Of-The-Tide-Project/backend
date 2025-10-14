import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Book } from './models/book.model';
import { KnowledgeArticle } from './models/knowledge-article.model';
import { Adventure } from './models/adventure.model';
import { Location } from './models/location.model';

@Injectable()
export class KnowledgeService {
    constructor(
        @InjectModel(Book) private readonly bookModel: typeof Book,
        @InjectModel(KnowledgeArticle) private readonly articleModel: typeof KnowledgeArticle,
        @InjectModel(Adventure) private readonly adventureModel: typeof Adventure,
        @InjectModel(Location) private readonly locationModel: typeof Location,
    ) { }

    // ----------- BOOKS ------------
    async createBook(data: Partial<Book>) {
        return this.bookModel.create(data as any);
    }

    async findAllBooks() {
        return this.bookModel.findAll();
    }

    async findBookById(id: string) {
        const book = await this.bookModel.findByPk(id);
        if (!book) throw new NotFoundException(`Book ${id} not found`);
        return book;
    }

    async updateBook(id: string, data: any) {
        const [updated] = await this.bookModel.update(data, { where: { id } });
        if (!updated) throw new NotFoundException(`Book ${id} not found`);
        return this.findBookById(id);
    }

    async deleteBook(id: string) {
        const deleted = await this.bookModel.destroy({ where: { id } });
        if (!deleted) throw new NotFoundException(`Book ${id} not found`);
        return { message: `Book ${id} deleted successfully` };
    }

    // ----------- ARTICLES ------------
    async createArticle(data: Partial<KnowledgeArticle>) {
        return this.articleModel.create(data as any);
    }

    async findAllArticles() {
        return this.articleModel.findAll();
    }

    async findArticleById(id: string) {
        const article = await this.articleModel.findByPk(id);
        if (!article) throw new NotFoundException(`Article ${id} not found`);
        return article;
    }

    // ----------- ADVENTURES ------------
    async createAdventure(data: Partial<Adventure>) {
        return this.adventureModel.create(data as any);
    }

    async findAllAdventures() {
        return this.adventureModel.findAll({ include: [Location] });
    }

    // ----------- LOCATIONS ------------
    async createLocation(data: Partial<Location>) {
        return this.locationModel.create(data as any);
    }

    async findAllLocations() {
        return this.locationModel.findAll();
    }
}
