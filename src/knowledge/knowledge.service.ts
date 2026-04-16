import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Book } from './models/book.model';
import { BookReview } from './models/book-review.model';
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
  private reviewBase: BaseService<BookReview>;

  constructor(
    @InjectModel(Book) private readonly bookModel: typeof Book,
    @InjectModel(BookReview) private readonly reviewModel: typeof BookReview,
    @InjectModel(KnowledgeArticle)
    private readonly articleModel: typeof KnowledgeArticle,
    @InjectModel(Adventure) private readonly adventureModel: typeof Adventure,
    @InjectModel(Location) private readonly locationModel: typeof Location,
  ) {
    this.bookBase = new BaseService<Book>(this.bookModel);
    this.reviewBase = new BaseService<BookReview>(this.reviewModel);
    this.articleBase = new BaseService<KnowledgeArticle>(this.articleModel);
    this.adventureBase = new BaseService<Adventure>(this.adventureModel);
    this.locationBase = new BaseService<Location>(this.locationModel);
  }

  // ----------- BOOKS ------------

  async createBook(data: Partial<Book>) {
    return this.bookBase.create(data);
  }

  async findAllBooks(query: any = {}) {
    const where: Record<string, any> = {};

    if (query.genre) where['genre'] = query.genre;
    if (query.language) where['language'] = query.language;
    if (query.magazine_id) where['magazine_id'] = query.magazine_id;

    if (query.price_type === 'free') {
      where['price'] = { [Op.is]: null as any };
    } else if (query.price_type === 'paid') {
      where['price'] = { [Op.not]: null, [Op.gt]: 0 };
    }

    if (query.min_rating) {
      where['rating_average'] = { [Op.gte]: parseFloat(query.min_rating) };
    }

    // Remove filter keys so BaseService search doesn't try to use them as column filters
    const { genre, language, magazine_id, price_type, min_rating, ...rest } = query;

    return this.bookBase.findAll(rest, {
      where,
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

  // ----------- BOOK REVIEWS ------------

  async getBookReviews(bookId: string, query: any = {}) {
    return this.reviewBase.findAll(query, {
      where: { book_id: bookId },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'full_name', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async createBookReview(bookId: string, data: any) {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = await this.reviewModel.create({ ...data, book_id: bookId });

    // Recalculate denormalized rating on the book
    const allRatings = await this.reviewModel.findAll({ where: { book_id: bookId }, attributes: ['rating'] });
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    await this.bookModel.update(
      { rating_average: Math.round(avg * 10) / 10, rating_count: allRatings.length },
      { where: { id: bookId } },
    );

    return review;
  }

  async deleteBookReview(reviewId: string) {
    const review = await this.reviewModel.findByPk(reviewId);
    if (!review) throw new BadRequestException('Review not found');

    const bookId = review.book_id;
    await review.destroy();

    // Recalculate after deletion
    const allRatings = await this.reviewModel.findAll({ where: { book_id: bookId }, attributes: ['rating'] });
    const avg = allRatings.length
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;
    await this.bookModel.update(
      { rating_average: Math.round(avg * 10) / 10, rating_count: allRatings.length },
      { where: { id: bookId } },
    );

    return { message: 'Review deleted' };
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
      searchableFields: ['title', 'description'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findAdventureById(id: string) {
    return this.adventureBase.findOne(id);
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
