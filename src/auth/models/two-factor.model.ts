import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'user_two_factor' })
export class UserTwoFactor extends Model<UserTwoFactor> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare user_id: string;

  @BelongsTo(() => User)
  declare user: User;

  // TOTP secret (store encrypted in production; here stored as base32)
  @Column({ type: DataType.STRING, allowNull: false })
  declare secret: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare enabled: boolean;

  // JSON array of one-time backup codes (hashed)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare backup_codes: string;
}
