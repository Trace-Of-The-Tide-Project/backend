import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Book } from './book.model';

@Table({ tableName: 'book_reviews' })
export class BookReview extends Model<BookReview> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Book)
  @Column({ type: DataType.UUID, allowNull: false })
  declare book_id: string;

  // Null for guest reviewers
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare user_id: string;

  // Display name for guest reviewers
  @Column({ type: DataType.STRING, allowNull: true })
  declare guest_name: string;

  // 1–5 star rating
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare rating: number;

  @Column(DataType.TEXT)
  declare review_text: string;

  // Optional memorable quote from the book
  @Column({ type: DataType.TEXT, allowNull: true })
  declare quote: string;

  @BelongsTo(() => Book)
  declare book: Book;

  @BelongsTo(() => User)
  declare reviewer: User;
}
