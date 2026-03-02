import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { UserRole } from './user-role.model';
import { UserProfile } from './user-profile.model';
import { UserStatus } from '../../enums/user-status.enum';

@Table({ tableName: 'users' })
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare username: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare full_name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: 'unique_phone_number',
  })
  declare phone_number: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.active,
    allowNull: false,
  })
  declare status: string;

  @HasMany(() => UserRole)
  declare userRoles: UserRole[];

  @HasOne(() => UserProfile)
  declare profile: UserProfile;
}
