import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Book } from './models/book.model';
import { KnowledgeArticle } from './models/knowledge-article.model';
import { Adventure } from './models/adventure.model';
import { Location } from './models/location.model';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class KnowledgeService {
  private bookBase: BaseService;
  private articleBase: BaseService;
  private adventureBase: BaseService;
  private locationBase: BaseService;

  constructor(
    @InjectModel(Book) private readonly bookModel: typeof Book,
    @InjectModel(KnowledgeArticle)
    private readonly articleModel: typeof KnowledgeArticle,
    @InjectModel(Adventure) private readonly adventureModel: typeof Adventure,
    @InjectModel(Location) private readonly locationModel: typeof Location,
  ) {
    this.bookBase = new BaseService(this.bookModel);
    this.articleBase = new BaseService(this.articleModel);
    this.adventureBase = new BaseService(this.adventureModel);
    this.locationBase = new BaseService(this.locationModel);
  }

  // ----------- BOOKS ------------
  async createBook(data: Partial<Book>) {
    return this.bookBase.create(data);
  }

  async findAllBooks(query: any = {}) {
    return this.bookBase.findAll(query, {
      searchableFields: ['title', 'author'],
    });
  }

  async findBookById(id: string) {
    return this.bookBase.findOne(id);
  }

  async updateBook(id: string, data: any) {
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
      searchableFields: ['title', 'summary'],
    });
  }

  async findArticleById(id: string) {
    return this.articleBase.findOne(id);
  }

  // ----------- ADVENTURES ------------
  async createAdventure(data: Partial<Adventure>) {
    return this.adventureBase.create(data);
  }

  async findAllAdventures(query: any = {}) {
    return this.adventureBase.findAll(query, {
      include: [Location],
      searchableFields: ['title', 'description'],
      // example order by createdAt descending by default if no sortBy
      order: [['createdAt', 'DESC']],
    });
  }

  // ----------- LOCATIONS ------------
  async createLocation(data: Partial<Location>) {
    return this.locationBase.create(data);
  }

  async findAllLocations(query: any = {}) {
    return this.locationBase.findAll(query, {
      searchableFields: ['name', 'address'],
    });
  }
}
