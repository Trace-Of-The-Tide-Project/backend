import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'notifications', timestamps: false })
export class Notification extends Model<Notification> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @Column(DataType.TEXT)
  declare message: string;

  @Column(DataType.STRING)
  declare type: string; // e.g., "system", "review", "update"

  @Column({
    type: DataType.STRING,
    defaultValue: 'unread',
  })
  declare status: string; // unread | read

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare created_at: Date;

  @BelongsTo(() => User)
  declare user: User;
}
