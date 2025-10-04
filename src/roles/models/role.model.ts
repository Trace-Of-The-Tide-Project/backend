import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { UserRole } from '../../users/models/user-role.model';

@Table({ tableName: 'roles' })
export class Role extends Model<Role> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @Column(DataType.TEXT)
  declare description: string;

  @HasMany(() => UserRole, { foreignKey: 'role_id' })
  declare userRoles: UserRole[];
}
