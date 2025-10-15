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

  @BelongsTo(() => User)
  declare creator: User;

  @HasMany(() => Participant)
  declare participants: Participant[];
}
