import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Magazine } from '../../magazine/models/magazine.model';

@Table({ tableName: 'books' })
export class Book extends Model<Book> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ allowNull: false })
  declare title: string;

  // Primary author name
  @Column(DataType.STRING)
  declare author: string;

  // Additional contributors / co-authors stored as JSON array of strings
  @Column({ type: DataType.JSONB, allowNull: true })
  declare co_authors: string[];

  @Column(DataType.STRING)
  declare publisher: string;

  @Column(DataType.DATE)
  declare published_date: Date;

  // Year shorthand for display (e.g. 2025)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare year: number;

  @Column(DataType.TEXT)
  declare summary: string;

  @Column(DataType.STRING)
  declare cover_image: string;

  // Uploaded PDF — served via GCS signed URL
  @Column({ type: DataType.STRING, allowNull: true })
  declare pdf_url: string;

  // e.g. 'Non-fiction' | 'Philosophy' | 'Self-Help' | 'Fantasy' | 'Science Fiction'
  //      | 'Romance' | 'Mystery' | 'Biography' | 'History' | 'Adventure'
  @Column({ type: DataType.STRING, allowNull: true })
  declare genre: string;

  // e.g. 'en' | 'ar' | 'es' | 'fr' | 'de'
  @Column({ type: DataType.STRING, defaultValue: 'en' })
  declare language: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare page_count: number;

  // null = free; any positive value = paid
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare price: number;

  // Currency for the price field (e.g. 'USD')
  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  declare currency: string;

  // Denormalized average rating (1-5), updated on each review create/delete
  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  declare rating_average: number;

  // Denormalized total review count
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare rating_count: number;

  // Optional: scope book to a specific magazine
  @ForeignKey(() => Magazine)
  @Column({ type: DataType.UUID, allowNull: true })
  declare magazine_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => User)
  declare creator: User;

  @BelongsTo(() => Magazine)
  declare magazine: Magazine;
}
