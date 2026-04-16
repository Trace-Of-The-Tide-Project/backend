import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseService } from '../common/base.service';
import { BookClubSelection } from './models/book-club-selection.model';
import { Magazine } from '../magazine/models/magazine.model';
import { Discussion } from '../discussions/models/discussion.model';

@Injectable()
export class BookClubService extends BaseService<BookClubSelection> {
  private readonly defaultInclude = [
    { model: Magazine, attributes: ['id', 'slug', 'name'] },
    { model: Discussion, attributes: ['id', 'title', 'status'] },
  ];

  constructor(
    @InjectModel(BookClubSelection)
    private readonly bookModel: typeof BookClubSelection,
  ) {
    super(bookModel);
  }

  async findAll(query: any = {}) {
    return super.findAll(query, {
      include: this.defaultInclude,
      searchableFields: ['title', 'author_name', 'blurb'],
      order: [['sort_order', 'ASC']],
    });
  }

  async findOne(id: string) {
    return super.findOne(id, { include: this.defaultInclude });
  }

  async findActiveByMagazine(magazineId: string) {
    return this.bookModel.findAll({
      where: { magazine_id: magazineId, active: true },
      include: this.defaultInclude,
      order: [['sort_order', 'ASC']],
    });
  }

  async create(data: Partial<BookClubSelection>) {
    if (!(data as any).title) throw new BadRequestException('title is required');
    if (!(data as any).author_name) throw new BadRequestException('author_name is required');
    return super.create(data);
  }
}
