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
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare awarded_by: string;

  @Column(DataType.TEXT)
  declare reason: string;

  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  declare user: User;

  @BelongsTo(() => Badge, { foreignKey: 'badge_id', as: 'badge' })
  declare badge: Badge;

  @BelongsTo(() => User, { foreignKey: 'awarded_by', as: 'awarder' })
  declare awarder: User;
}