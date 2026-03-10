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
import { Participant } from './participant.model';

@Table({ tableName: 'open_calls' })
export class OpenCall extends Model<OpenCall> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column(DataType.STRING)
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.STRING)
  declare category: string;

  @Column(DataType.DATE)
  declare timeline_start: Date;

  @Column(DataType.DATE)
  declare timeline_end: Date;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @Column({ type: DataType.STRING, defaultValue: 'open' })
  declare status: string;

  // New fields from UI designs
  @Column({ type: DataType.STRING, allowNull: true })
  declare edition: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cover_image: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare images: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  declare body_content: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare author_name: string;

  // Associations
  @BelongsTo(() => User)
  declare creator: User;

  @HasMany(() => Participant)
  declare participants: Participant[];
}
