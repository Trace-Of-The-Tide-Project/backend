import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Role } from '../../roles/models/role.model';

@Table({ tableName: 'user_roles' })
export class UserRole extends Model<UserRole> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Role)
  @Column(DataType.UUID)
  declare role_id: string;

  @BelongsTo(() => Role, { as: 'role' })
  declare role: Role;

  @Column(DataType.DATE)
  declare assigned_at: Date;
}
