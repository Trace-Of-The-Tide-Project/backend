import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Magazine } from '../../magazine/models/magazine.model';
import { Discussion } from '../../discussions/models/discussion.model';

@Table({ tableName: 'book_club_selections' })
export class BookClubSelection extends Model<BookClubSelection> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Magazine)
  @Column({ type: DataType.UUID, allowNull: false })
  declare magazine_id: string;

  // The external book title (not a platform Article)
  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare author_name: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare year: number;

  // Cover image URL
  @Column({ type: DataType.STRING, allowNull: true })
  declare cover_image: string;

  // Editorial blurb shown on the card
  @Column(DataType.TEXT)
  declare blurb: string;

  // Optional companion platform article (e.g. an essay about the book)
  @Column({ type: DataType.UUID, allowNull: true })
  declare companion_article_id: string;

  // Discussion thread created on publish; reuses existing discussions module
  @ForeignKey(() => Discussion)
  @Column({ type: DataType.UUID, allowNull: true })
  declare discussion_id: string;

  // Controls sort order in the book club strip
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare sort_order: number;

  // Only active selections are shown publicly
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare active: boolean;

  @BelongsTo(() => Magazine)
  declare magazine: Magazine;

  @BelongsTo(() => Discussion)
  declare discussion: Discussion;
}
