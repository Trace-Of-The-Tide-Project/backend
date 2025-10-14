import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Contribution } from '../../contributions/models/contribution.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'moderation_logs' })
export class ModerationLog extends Model<ModerationLog> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare contribution_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare reviewer_id: string;

  @Column(DataType.STRING)
  declare action: string; // approved | rejected | flagged

  @Column(DataType.TEXT)
  declare reason: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare created_at: Date;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;

  @BelongsTo(() => User)
  declare reviewer: User;
}
