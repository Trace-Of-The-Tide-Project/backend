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

@Table({ tableName: 'magazines' })
export class Magazine extends Model<Magazine> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // URL-friendly identifier (e.g. 'trace-of-the-tide')
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  // Short tagline shown in hero (e.g. "Stories shaping modern culture")
  @Column({ type: DataType.STRING, allowNull: true })
  declare tagline: string;

  @Column(DataType.TEXT)
  declare description: string;

  // Cover / banner image URL
  @Column({ type: DataType.STRING, allowNull: true })
  declare cover_image: string;

  // Brand colors, accent, fonts – kept flexible as JSON so UI can evolve
  @Column({ type: DataType.JSONB, allowNull: true })
  declare theme: object;

  // Link to CMS landing page for this magazine
  @Column({ type: DataType.UUID, allowNull: true })
  declare cms_page_id: string;

  // Currency used for crowdfunded issues (e.g. 'USD', 'SAR')
  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  declare default_currency: string;

  // 'draft' | 'live' | 'archived'
  @Column({ type: DataType.STRING, defaultValue: 'draft' })
  declare status: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
