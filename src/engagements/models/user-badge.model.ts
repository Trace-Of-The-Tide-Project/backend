import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Badge } from '../../system-settings/models/badge.model';

@Table({ tableName: 'user_badges' })
export class UserBadge extends Model<UserBadge> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @ForeignKey(() => Badge)
  @Column({ type: DataType.UUID, allowNull: false })
  declare badge_id: string;

  // Who awarded it (admin user id)
  @Column(DataType.UUID)
  declare awarded_by: string;

  @Column(DataType.TEXT)
  declare reason: string;

  @BelongsTo(() => User, 'user_id')
  declare user: User;

  @BelongsTo(() => Badge, 'badge_id')
  declare badge: Badge;

  @BelongsTo(() => User, 'awarded_by')
  declare awarder: User;
}