import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'user_permissions' })
export class UserPermission extends Model<UserPermission> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  declare user: User;

  // e.g. 'content.publish', 'finance.view'
  @Column({ type: DataType.STRING, allowNull: false })
  declare permission: string;

  // true = explicit grant, false = explicit revoke (overrides role default)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare granted: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;
}
