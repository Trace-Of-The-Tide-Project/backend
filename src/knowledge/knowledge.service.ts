import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Book } from './models/book.model';
import { KnowledgeArticle } from './models/knowledge-article.model';
import { Adventure } from './models/adventure.model';
import { Location } from './models/location.model';
import { User } from '../users/models/user.model';
import { BaseService } from '../common/base.service';

@Injectable()
export class KnowledgeService {
  private bookBase: BaseService<Book>;
  private articleBase: BaseService<KnowledgeArticle>;
  private adventureBase: BaseService<Adventure>;
  private locationBase: BaseService<Location>;

  constructor(
    @InjectModel(Book) private readonly bookModel: typeof Book,
    @InjectModel(KnowledgeArticle)
    private readonly articleModel: typeof KnowledgeArticle,
    @InjectModel(Adventure) private readonly adventureModel: typeof Adventure,
    @InjectModel(Location) private readonly locationModel: typeof Location,
  ) {
    this.bookBase = new BaseService<Book>(this.bookModel);
    this.articleBase = new BaseService<KnowledgeArticle>(this.articleModel);
    this.adventureBase = new BaseService<Adventure>(this.adventureModel);
    this.locationBase = new BaseService<Location>(this.locationModel);
  }

  // ----------- BOOKS ------------
  async createBook(data: Partial<Book>) {
    return this.bookBase.create(data);
  }

  async findAllBooks(query: any = {}) {
    return this.bookBase.findAll(query, {
      searchableFields: ['title', 'author'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findBookById(id: string) {
    return this.bookBase.findOne(id);
  }

  async updateBook(id: string, data: Partial<Book>) {
    return this.bookBase.update(id, data);
  }

  async deleteBook(id: string) {
    return this.bookBase.remove(id);
  }

  // ----------- ARTICLES ------------
  async createArticle(data: Partial<KnowledgeArticle>) {
    return this.articleBase.create(data);
  }

  async findAllArticles(query: any = {}) {
    return this.articleBase.findAll(query, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'full_name'] },
      ],
      searchableFields: ['title', 'content'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findArticleById(id: string) {
    return this.articleBase.findOne(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'full_name'] },
      ],
    });
  }

  async updateArticle(id: string, data: Partial<KnowledgeArticle>) {
    return this.articleBase.update(id, data);
  }

  async deleteArticle(id: string) {
    return this.articleBase.remove(id);
  }

  // ----------- ADVENTURES ------------
  async createAdventure(data: Partial<Adventure>) {
    return this.adventureBase.create(data);
  }

  async findAllAdventures(query: any = {}) {
    return this.adventureBase.findAll(query, {
      include: [Location],
      searchableFields: ['title', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findAdventureById(id: string) {
    return this.adventureBase.findOne(id, { include: [Location] });
  }

  async updateAdventure(id: string, data: Partial<Adventure>) {
    return this.adventureBase.update(id, data);
  }

  async deleteAdventure(id: string) {
    return this.adventureBase.remove(id);
  }

  // ----------- LOCATIONS ------------
  async createLocation(data: Partial<Location>) {
    return this.locationBase.create(data);
  }

  async findAllLocations(query: any = {}) {
    return this.locationBase.findAll(query, {
      searchableFields: ['name', 'address'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findLocationById(id: string) {
    return this.locationBase.findOne(id);
  }

  async updateLocation(id: string, data: Partial<Location>) {
    return this.locationBase.update(id, data);
  }

  async deleteLocation(id: string) {
    return this.locationBase.remove(id);
  }
}