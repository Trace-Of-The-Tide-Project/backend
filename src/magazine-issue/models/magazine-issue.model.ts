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
import { OpenCall } from '../../open call/models/open-call.model';

@Table({ tableName: 'magazine_issues' })
export class MagazineIssue extends Model<MagazineIssue> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Magazine)
  @Column({ type: DataType.UUID, allowNull: false })
  declare magazine_id: string;

  // Sequential edition number within a magazine (e.g. 5)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare edition_number: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare subtitle: string;

  @Column({ type: DataType.STRING, unique: true })
  declare slug: string;

  // Cover / banner image URL
  @Column({ type: DataType.STRING, allowNull: true })
  declare cover_image: string;

  @Column(DataType.TEXT)
  declare description: string;

  // 'editorial' | 'crowdfunded'
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'editorial' })
  declare kind: string;

  // 'draft' | 'proposed' | 'funding' | 'funded' | 'published' | 'archived'
  @Column({ type: DataType.STRING, defaultValue: 'draft' })
  declare status: string;

  // Required when kind = 'crowdfunded', null for editorial
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare funding_goal: number;

  // Denormalized running total updated on each captured pledge
  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  declare funding_raised: number;

  // Required when kind = 'crowdfunded'
  @Column({ type: DataType.DATE, allowNull: true })
  declare funding_deadline: Date;

  // Optional: pitched via existing OpenCall flow
  @ForeignKey(() => OpenCall)
  @Column({ type: DataType.UUID, allowNull: true })
  declare open_call_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare published_at: Date;

  @BelongsTo(() => Magazine)
  declare magazine: Magazine;

  @BelongsTo(() => OpenCall)
  declare open_call: OpenCall;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
